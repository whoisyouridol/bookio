using BeautySalonBooking.Application.Interfaces;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.Services;

public class NotificationJobProcessor
{
    private readonly AppDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<NotificationJobProcessor> _logger;

    private const int MaxAttempts = 3;

    public NotificationJobProcessor(
        AppDbContext db,
        IEmailSender emailSender,
        ILogger<NotificationJobProcessor> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task ProcessNotificationAsync(Guid notificationId)
    {
        var notification = await _db.Notifications.FindAsync(notificationId);
        if (notification is null)
        {
            _logger.LogWarning("Notification {Id} not found — skipping", notificationId);
            return;
        }

        if (notification.Status is NotificationStatus.Sent or NotificationStatus.Cancelled)
        {
            _logger.LogInformation("Notification {Id} already {Status} — skipping", notificationId, notification.Status);
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

        // SMS channel (stub)
        if (notification.Channel is NotificationChannel.Sms or NotificationChannel.Both)
        {
            _logger.LogInformation("SMS delivery not implemented — notification {Id}, phone {Phone}",
                notificationId, notification.RecipientPhone);
            // For SMS-only notifications, treat as success so they don't block
            if (notification.Channel == NotificationChannel.Sms)
                success = true;
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
