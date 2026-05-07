using Bookio.Application.Interfaces;
using Bookio.Domain.Enums;
using Bookio.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Bookio.Infrastructure.Services;

public class NotificationJobProcessor
{
    private readonly AppDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly ISmsSender _smsSender;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NotificationJobProcessor> _logger;

    private const int MaxAttempts = 3;

    public NotificationJobProcessor(
        AppDbContext db,
        IEmailSender emailSender,
        ISmsSender smsSender,
        IConfiguration configuration,
        ILogger<NotificationJobProcessor> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _smsSender = smsSender;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task ProcessNotificationAsync(Guid notificationId)
    {
        var notification = await _db.Notifications
            .Include(n => n.Booking)
            .FirstOrDefaultAsync(n => n.Id == notificationId);

        if (notification is null)
        {
            _logger.LogWarning("Notification {Id} not found — skipping", notificationId);
            return;
        }

        if (notification.Status is NotificationStatus.Sent or NotificationStatus.Cancelled or NotificationStatus.Skipped)
        {
            _logger.LogInformation("Notification {Id} already {Status} — skipping", notificationId, notification.Status);
            return;
        }

        // Staleness guard: if the appointment has already passed, do not send — mark as Skipped
        var tzOffset = TimeSpan.FromHours(_configuration.GetValue<int>("Booking:TimezoneOffsetHours", 4));
        var appointmentUtc = DateTime.SpecifyKind(
            notification.Booking.BookingDate.ToDateTime(notification.Booking.StartTime) - tzOffset,
            DateTimeKind.Utc);

        if (appointmentUtc <= DateTime.UtcNow)
        {
            notification.Status = NotificationStatus.Skipped;
            notification.FailureReason = "Appointment already passed — reminder not sent";
            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Notification {Id} ({Type}) skipped — appointment {Date} {Time} already passed",
                notificationId, notification.Type, notification.Booking.BookingDate, notification.Booking.StartTime);
            return;
        }

        notification.AttemptCount++;
        notification.LastAttemptAt = DateTime.UtcNow;

        var success = false;

        // Email channel
        if (notification.Channel is NotificationChannel.Email or NotificationChannel.Both)
        {
            if (!string.IsNullOrEmpty(notification.RecipientEmail)
                && !string.IsNullOrEmpty(notification.Subject)
                && !string.IsNullOrEmpty(notification.Body))
            {
                success = await _emailSender.SendEmailAsync(
                    notification.RecipientEmail,
                    notification.Subject,
                    notification.Body);
            }
            else
            {
                _logger.LogWarning("Notification {Id} missing email fields — skipping email", notificationId);
            }
        }

        // SMS channel
        if (notification.Channel is NotificationChannel.Sms or NotificationChannel.Both)
        {
            if (!string.IsNullOrEmpty(notification.RecipientPhone)
                && !string.IsNullOrEmpty(notification.Body))
            {
                var smsResult = await _smsSender.SendSmsAsync(
                    notification.RecipientPhone, notification.Body);
                // For SMS-only, this is the sole success indicator
                if (notification.Channel == NotificationChannel.Sms)
                    success = smsResult;
                // For Both, email success already set; SMS failure is logged but doesn't override
                else if (!smsResult)
                    _logger.LogWarning("SMS delivery failed for notification {Id}", notificationId);
            }
            else
            {
                _logger.LogWarning("Notification {Id} missing SMS fields — skipping SMS", notificationId);
                if (notification.Channel == NotificationChannel.Sms)
                    success = false;
            }
        }

        if (success)
        {
            notification.Status = NotificationStatus.Sent;
            notification.SentAt = DateTime.UtcNow;
            _logger.LogInformation("Notification {Id} sent successfully", notificationId);
        }
        else if (notification.AttemptCount >= MaxAttempts)
        {
            notification.Status = NotificationStatus.Failed;
            notification.FailureReason = $"Failed after {MaxAttempts} attempts";
            _logger.LogWarning("Notification {Id} failed permanently after {Attempts} attempts",
                notificationId, MaxAttempts);
        }
        else
        {
            // Save progress and throw so Hangfire auto-retries
            await _db.SaveChangesAsync();
            throw new InvalidOperationException(
                $"Notification {notificationId} delivery failed — attempt {notification.AttemptCount}/{MaxAttempts}");
        }

        await _db.SaveChangesAsync();
    }
}
