using Bookio.Application.Interfaces;
using Bookio.Domain.Entities;
using Bookio.Domain.Enums;
using Bookio.Infrastructure.Observability;
using Bookio.Infrastructure.Persistence;
using Bookio.Infrastructure.Resources;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Bookio.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly IBackgroundJobClient _jobClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NotificationService> _logger;
    private readonly EmailMessages _msg;
    private readonly SmsMessages _sms;

    public NotificationService(
        AppDbContext db,
        IBackgroundJobClient jobClient,
        IConfiguration configuration,
        ILogger<NotificationService> logger,
        EmailMessages msg,
        SmsMessages sms)
    {
        _db = db;
        _jobClient = jobClient;
        _configuration = configuration;
        _logger = logger;
        _msg = msg;
        _sms = sms;
    }

    // ── Booking notifications ────────────────────────────────────────────────

    public async Task SendBookingPendingApprovalAsync(Guid bookingId)
    {
        var booking = await LoadBookingAsync(bookingId);
        if (booking is null) return;

        // Notify the master (via their salon master email or booking contact)
        var key = "bookingPendingApproval";
        var subject = _msg.Get(key, "subject").Replace("{clientName}", booking.ClientName);
        var body = BuildBookingHtml(booking,
            _msg.Get(key, "kaTitle"), _msg.Get(key, "enTitle"),
            _msg.Get(key, "kaMessage"), _msg.Get(key, "enMessage"));

        await CreateAndEnqueueNotificationAsync(
            booking, NotificationType.BookingPendingApproval,
            booking.ClientEmail, subject, body);

        // SMS to client
        await CreateAndEnqueueSmsNotificationAsync(booking, NotificationType.BookingPendingApproval,
            booking.ClientPhone, key, "toMaster");
    }

    public async Task SendBookingConfirmedAsync(Guid bookingId)
    {
        var booking = await LoadBookingAsync(bookingId);
        if (booking is null) return;

        var key = "bookingConfirmed";
        var subject = _msg.Get(key, "subject").Replace("{salonName}", booking.Salon?.Name ?? "");
        var body = BuildBookingHtml(booking,
            _msg.Get(key, "kaTitle"), _msg.Get(key, "enTitle"),
            _msg.Get(key, "kaMessage"), _msg.Get(key, "enMessage"));

        await CreateAndEnqueueNotificationAsync(
            booking, NotificationType.BookingConfirmation,
            booking.ClientEmail, subject, body);

        // SMS to client
        await CreateAndEnqueueSmsNotificationAsync(booking, NotificationType.BookingConfirmation,
            booking.ClientPhone, key, "toClient");

        // Schedule reminder notifications (SMS only)
        await ScheduleRemindersAsync(booking);
    }

    public async Task SendBookingCancelledAsync(Guid bookingId, CancellationSide cancelledBy)
    {
        var booking = await LoadBookingAsync(bookingId);
        if (booking is null) return;

        var key = cancelledBy == CancellationSide.Client ? "bookingCancelledByClient" : "bookingCancelledByMaster";
        var subject = _msg.Get(key, "subject").Replace("{salonName}", booking.Salon?.Name ?? "");
        var body = BuildBookingHtml(booking,
            _msg.Get(key, "kaTitle"), _msg.Get(key, "enTitle"),
            _msg.Get(key, "kaMessage"), _msg.Get(key, "enMessage"));

        await CreateAndEnqueueNotificationAsync(
            booking, NotificationType.BookingCancelled,
            booking.ClientEmail, subject, body);

        // SMS to client
        var smsRecipientType = cancelledBy == CancellationSide.Client ? "toMaster" : "toClient";
        await CreateAndEnqueueSmsNotificationAsync(booking, NotificationType.BookingCancelled,
            booking.ClientPhone, key, smsRecipientType);

        // Cancel pending notifications for this booking
        await CancelPendingNotificationsAsync(bookingId);
    }

    public async Task SendBookingApprovalReminderAsync(Guid bookingId)
    {
        var booking = await LoadBookingAsync(bookingId);
        if (booking is null) return;

        var key = "bookingApprovalReminder";
        var subject = _msg.Get(key, "subject");
        var body = BuildBookingHtml(booking,
            _msg.Get(key, "kaTitle"), _msg.Get(key, "enTitle"),
            _msg.Get(key, "kaMessage"), _msg.Get(key, "enMessage"));

        await CreateAndEnqueueNotificationAsync(
            booking, NotificationType.BookingApprovalReminder,
            booking.ClientEmail, subject, body);

        // SMS to master
        await CreateAndEnqueueSmsNotificationAsync(booking, NotificationType.BookingApprovalReminder,
            booking.ClientPhone, key, "toMaster");
    }

    public async Task SendBookingExpiredAsync(Guid bookingId)
    {
        var booking = await LoadBookingAsync(bookingId);
        if (booking is null) return;

        var key = "bookingExpired";
        var subject = _msg.Get(key, "subject").Replace("{salonName}", booking.Salon?.Name ?? "");
        var body = BuildBookingHtml(booking,
            _msg.Get(key, "kaTitle"), _msg.Get(key, "enTitle"),
            _msg.Get(key, "kaMessage"), _msg.Get(key, "enMessage"));

        // Email to client
        await CreateAndEnqueueNotificationAsync(
            booking, NotificationType.BookingExpired,
            booking.ClientEmail, subject, body);

        // SMS to client
        await CreateAndEnqueueSmsNotificationAsync(booking, NotificationType.BookingExpired,
            booking.ClientPhone, key, "toClient");

        // Cancel any pending notifications for this booking
        await CancelPendingNotificationsAsync(bookingId);
    }

    public async Task SendBookingCompletedAsync(Guid bookingId)
    {
        var booking = await LoadBookingAsync(bookingId);
        if (booking is null) return;

        var key = "bookingCompleted";
        var subject = _msg.Get(key, "subject").Replace("{salonName}", booking.Salon?.Name ?? "");
        var body = BuildBookingHtml(booking,
            _msg.Get(key, "kaTitle"), _msg.Get(key, "enTitle"),
            _msg.Get(key, "kaMessage"), _msg.Get(key, "enMessage"));

        await CreateAndEnqueueNotificationAsync(
            booking, NotificationType.BookingCompleted,
            booking.ClientEmail, subject, body);

        // SMS to client
        await CreateAndEnqueueSmsNotificationAsync(booking, NotificationType.BookingCompleted,
            booking.ClientPhone, key, "toClient");
    }

    public async Task SendReminderOneDayBeforeAsync(Guid bookingId)
    {
        var booking = await LoadBookingAsync(bookingId);
        if (booking is null) return;

        var key = "reminder24h";
        var subject = _msg.Get(key, "subject");
        var body = BuildBookingHtml(booking,
            _msg.Get(key, "kaTitle"), _msg.Get(key, "enTitle"),
            _msg.Get(key, "kaMessage"), _msg.Get(key, "enMessage"));

        await CreateAndEnqueueNotificationAsync(
            booking, NotificationType.Reminder24h,
            booking.ClientEmail, subject, body);
    }

    public async Task SendReminderTwoHoursBeforeAsync(Guid bookingId)
    {
        var booking = await LoadBookingAsync(bookingId);
        if (booking is null) return;

        var key = "reminder3h";
        var subject = _msg.Get(key, "subject");
        var body = BuildBookingHtml(booking,
            _msg.Get(key, "kaTitle"), _msg.Get(key, "enTitle"),
            _msg.Get(key, "kaMessage"), _msg.Get(key, "enMessage"));

        await CreateAndEnqueueNotificationAsync(
            booking, NotificationType.Reminder3h,
            booking.ClientEmail, subject, body);
    }

    // ── Auth notifications (no Notification record — fire-and-forget email) ──

    public Task SendPasswordResetAsync(string email, string resetToken)
    {
        var key = "passwordReset";
        var subject = _msg.Get(key, "subject");
        var body = WrapEmail($"""
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1A1614;">{_msg.Get(key, "kaTitle")}</h2>
            <p style="margin:0 0 4px;font-size:13px;color:#B8623A;font-weight:500;letter-spacing:.5px;text-transform:uppercase;">{_msg.Get(key, "enTitle")}</p>
            <div style="height:1px;background:#E8E2DA;margin:16px 0 24px;"></div>
            <p style="margin:0 0 8px;color:#1A1614;">{_msg.Get(key, "kaBody")}</p>
            <p style="margin:0 0 16px;font-size:12px;color:#6E6259;">{_msg.Get(key, "enBody")}</p>
            <div style="background:#FBF0E8;border:1px solid #E8E2DA;border-radius:10px;padding:16px;font-family:monospace;font-size:15px;letter-spacing:2px;text-align:center;color:#B8623A;margin-bottom:16px;">{resetToken}</div>
            <p style="margin:0;font-size:13px;color:#6E6259;">{_msg.Get(key, "kaFootnote")}<br>{_msg.Get(key, "enFootnote")}</p>
            """);
        return EnqueueAuthEmailAsync(email, subject, body);
    }

    public Task SendPasswordChangedAsync(string email)
    {
        var key = "passwordChanged";
        var subject = _msg.Get(key, "subject");
        var body = WrapEmail($"""
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1A1614;">{_msg.Get(key, "kaTitle")}</h2>
            <p style="margin:0 0 4px;font-size:13px;color:#B8623A;font-weight:500;letter-spacing:.5px;text-transform:uppercase;">{_msg.Get(key, "enTitle")}</p>
            <div style="height:1px;background:#E8E2DA;margin:16px 0 24px;"></div>
            <p style="margin:0 0 8px;color:#1A1614;">{_msg.Get(key, "kaBody")}</p>
            <p style="margin:0 0 16px;font-size:12px;color:#6E6259;">{_msg.Get(key, "enBody")}</p>
            <p style="margin:0;font-size:13px;color:#6E6259;">{_msg.Get(key, "kaFootnote")}<br>{_msg.Get(key, "enFootnote")}</p>
            """);
        return EnqueueAuthEmailAsync(email, subject, body);
    }

    public Task SendMasterCredentialsAsync(string email, string temporaryPassword)
    {
        var key = "masterCredentials";
        var subject = _msg.Get(key, "subject");
        var body = WrapEmail($"""
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1A1614;">{_msg.Get(key, "kaTitle")}</h2>
            <p style="margin:0 0 4px;font-size:13px;color:#B8623A;font-weight:500;letter-spacing:.5px;text-transform:uppercase;">{_msg.Get(key, "enTitle")}</p>
            <div style="height:1px;background:#E8E2DA;margin:16px 0 24px;"></div>
            <p style="margin:0 0 8px;color:#1A1614;">{_msg.Get(key, "kaBody")}</p>
            <p style="margin:0 0 20px;font-size:12px;color:#6E6259;">{_msg.Get(key, "enBody")}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:10px 12px;background:#FAF8F5;border-radius:8px 8px 0 0;border-bottom:1px solid #E8E2DA;font-size:13px;color:#6E6259;width:40%;">{_msg.Label("email")}</td><td style="padding:10px 12px;background:#FAF8F5;border-radius:8px 8px 0 0;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;">{email}</td></tr>
              <tr><td style="padding:10px 12px;background:#FAF8F5;border-radius:0 0 8px 8px;font-size:13px;color:#6E6259;">{_msg.Label("tempPassword")}</td><td style="padding:10px 12px;background:#FAF8F5;border-radius:0 0 8px 8px;font-size:14px;font-family:monospace;color:#B8623A;letter-spacing:1px;">{temporaryPassword}</td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6E6259;">{_msg.Get(key, "kaFootnote")}<br>{_msg.Get(key, "enFootnote")}</p>
            """);
        return EnqueueAuthEmailAsync(email, subject, body);
    }

    public Task SendAccountCredentialsAsync(string email, string temporaryPassword, string role)
    {
        var key = "accountCredentials";
        var subject = _msg.Get(key, "subject");
        var body = WrapEmail($"""
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1A1614;">{_msg.Get(key, "kaTitle")}</h2>
            <p style="margin:0 0 4px;font-size:13px;color:#B8623A;font-weight:500;letter-spacing:.5px;text-transform:uppercase;">{_msg.Get(key, "enTitle")}</p>
            <div style="height:1px;background:#E8E2DA;margin:16px 0 24px;"></div>
            <p style="margin:0 0 8px;color:#1A1614;">{_msg.Get(key, "kaBody").Replace("{role}", role)}</p>
            <p style="margin:0 0 20px;font-size:12px;color:#6E6259;">{_msg.Get(key, "enBody").Replace("{role}", role)}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:10px 12px;background:#FAF8F5;border-radius:8px 8px 0 0;border-bottom:1px solid #E8E2DA;font-size:13px;color:#6E6259;width:40%;">{_msg.Label("email")}</td><td style="padding:10px 12px;background:#FAF8F5;border-radius:8px 8px 0 0;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;">{email}</td></tr>
              <tr><td style="padding:10px 12px;background:#FAF8F5;border-radius:0 0 8px 8px;font-size:13px;color:#6E6259;">{_msg.Label("tempPassword")}</td><td style="padding:10px 12px;background:#FAF8F5;border-radius:0 0 8px 8px;font-size:14px;font-family:monospace;color:#B8623A;letter-spacing:1px;">{temporaryPassword}</td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6E6259;">{_msg.Get(key, "kaFootnote")}<br>{_msg.Get(key, "enFootnote")}</p>
            """);
        return EnqueueAuthEmailAsync(email, subject, body);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task<Booking?> LoadBookingAsync(Guid bookingId)
    {
        var booking = await _db.Bookings
            .Include(b => b.Salon)
            .Include(b => b.Master)
            .Include(b => b.BookingServices)
                .ThenInclude(bs => bs.MasterService)
                    .ThenInclude(ms => ms.Service)
            .Include(b => b.Notifications)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking is null)
            _logger.LogWarning("Booking {BookingId} not found for notification", bookingId);

        return booking;
    }

    private async Task CreateAndEnqueueNotificationAsync(
        Booking booking, NotificationType type, string? recipientEmail,
        string subject, string body)
    {
        using var activity = Telemetry.Source.StartActivity("Notification.Enqueue");
        activity?.SetTag("notification.type", type.ToString());
        activity?.SetTag("notification.booking_id", booking.Id.ToString());
        if (string.IsNullOrEmpty(recipientEmail))
        {
            _logger.LogInformation("No email for booking {BookingId} — skipping {Type}", booking.Id, type);
            return;
        }

        // Check for duplicate (same booking + type + channel)
        var exists = booking.Notifications.Any(n =>
            n.Type == type
            && n.Channel == NotificationChannel.Email
            && n.Status != NotificationStatus.Cancelled);

        if (exists)
        {
            _logger.LogInformation("Notification {Type} already exists for booking {BookingId} — skipping",
                type, booking.Id);
            return;
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Type = type,
            Channel = NotificationChannel.Email,
            Status = NotificationStatus.Pending,
            RecipientEmail = recipientEmail,
            Subject = subject,
            Body = body,
            ScheduledAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        var jobId = _jobClient.Enqueue<NotificationJobProcessor>(
            p => p.ProcessNotificationAsync(notification.Id));

        notification.HangfireJobId = jobId;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Enqueued {Type} notification {NotificationId} for booking {BookingId}",
            type, notification.Id, booking.Id);
    }

    private async Task ScheduleRemindersAsync(Booking booking)
    {
        var hasPhone = !string.IsNullOrEmpty(booking.ClientPhone);
        var hasEmail = !string.IsNullOrEmpty(booking.ClientEmail);
        if (!hasPhone && !hasEmail) return;

        var tzOffsetHours = _configuration.GetValue<int>("Booking:TimezoneOffsetHours", 4);
        var tzOffset = TimeSpan.FromHours(tzOffsetHours);

        var appointmentLocalDt = booking.BookingDate.ToDateTime(booking.StartTime);
        var appointmentUtc = DateTime.SpecifyKind(appointmentLocalDt - tzOffset, DateTimeKind.Utc);

        var placeholders = new Dictionary<string, string>
        {
            ["salonName"] = booking.Salon?.Name ?? "",
            ["time"] = booking.StartTime.ToString("HH:mm"),
            ["date"] = booking.BookingDate.ToString("dd.MM.yyyy")
        };

        // 24-hour reminder
        var reminder24At = appointmentUtc.AddHours(-24);
        if (reminder24At > DateTime.UtcNow)
        {
            if (hasPhone)
                await ScheduleSmsReminderAsync(booking, NotificationType.Reminder24h,
                    reminder24At, "reminder24h", "toClient", placeholders);
            if (hasEmail)
                await ScheduleEmailReminderAsync(booking, NotificationType.Reminder24h, reminder24At, "reminder24h");
        }

        // 3-hour reminder
        var reminder3At = appointmentUtc.AddHours(-3);
        if (reminder3At > DateTime.UtcNow)
        {
            if (hasPhone)
                await ScheduleSmsReminderAsync(booking, NotificationType.Reminder3h,
                    reminder3At, "reminder3h", "toClient", placeholders);
            if (hasEmail)
                await ScheduleEmailReminderAsync(booking, NotificationType.Reminder3h, reminder3At, "reminder3h");
        }
    }

    private async Task CreateAndEnqueueSmsNotificationAsync(
        Booking booking, NotificationType type, string? recipientPhone,
        string smsMessageKey, string smsRecipientType)
    {
        if (string.IsNullOrEmpty(recipientPhone))
        {
            _logger.LogInformation("No phone for booking {BookingId} — skipping SMS {Type}", booking.Id, type);
            return;
        }

        // Check for duplicate (same booking + type + SMS channel)
        var exists = booking.Notifications.Any(n =>
            n.Type == type
            && n.Channel == NotificationChannel.Sms
            && n.Status != NotificationStatus.Cancelled);

        if (exists) return;

        var placeholders = new Dictionary<string, string>
        {
            ["salonName"] = booking.Salon?.Name ?? "",
            ["date"] = booking.BookingDate.ToString("dd.MM.yyyy"),
            ["time"] = booking.StartTime.ToString("HH:mm"),
            ["clientName"] = booking.ClientName ?? ""
        };

        var smsBody = _sms.Format(smsMessageKey, smsRecipientType, placeholders);

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Type = type,
            Channel = NotificationChannel.Sms,
            Status = NotificationStatus.Pending,
            RecipientPhone = recipientPhone,
            Body = smsBody,
            ScheduledAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        var jobId = _jobClient.Enqueue<NotificationJobProcessor>(
            p => p.ProcessNotificationAsync(notification.Id));

        notification.HangfireJobId = jobId;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Enqueued SMS {Type} notification {NotificationId} for booking {BookingId}",
            type, notification.Id, booking.Id);
    }

    private async Task ScheduleSmsReminderAsync(
        Booking booking, NotificationType type, DateTime scheduledUtc,
        string smsMessageKey, string smsRecipientType, Dictionary<string, string> placeholders)
    {
        // Check for duplicate (SMS channel)
        var exists = booking.Notifications.Any(n =>
            n.Type == type
            && n.Channel == NotificationChannel.Sms
            && n.Status != NotificationStatus.Cancelled);

        if (exists) return;

        var smsBody = _sms.Format(smsMessageKey, smsRecipientType, placeholders);

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Type = type,
            Channel = NotificationChannel.Sms,
            Status = NotificationStatus.Pending,
            RecipientPhone = booking.ClientPhone,
            Body = smsBody,
            ScheduledAt = scheduledUtc,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        var delay = scheduledUtc - DateTime.UtcNow;
        var jobId = _jobClient.Schedule<NotificationJobProcessor>(
            p => p.ProcessNotificationAsync(notification.Id),
            delay);

        notification.HangfireJobId = jobId;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Scheduled SMS {Type} reminder for booking {BookingId} at {ScheduledAt}",
            type, booking.Id, scheduledUtc);
    }

    private async Task ScheduleEmailReminderAsync(
        Booking booking, NotificationType type, DateTime scheduledUtc, string msgKey)
    {
        var exists = booking.Notifications.Any(n =>
            n.Type == type
            && n.Channel == NotificationChannel.Email
            && n.Status != NotificationStatus.Cancelled);

        if (exists) return;

        var subject = _msg.Get(msgKey, "subject");
        var body = BuildBookingHtml(booking,
            _msg.Get(msgKey, "kaTitle"), _msg.Get(msgKey, "enTitle"),
            _msg.Get(msgKey, "kaMessage"), _msg.Get(msgKey, "enMessage"));

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Type = type,
            Channel = NotificationChannel.Email,
            Status = NotificationStatus.Pending,
            RecipientEmail = booking.ClientEmail,
            Subject = subject,
            Body = body,
            ScheduledAt = scheduledUtc,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        var delay = scheduledUtc - DateTime.UtcNow;
        var jobId = _jobClient.Schedule<NotificationJobProcessor>(
            p => p.ProcessNotificationAsync(notification.Id),
            delay);

        notification.HangfireJobId = jobId;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Scheduled email {Type} reminder for booking {BookingId} at {ScheduledAt}",
            type, booking.Id, scheduledUtc);
    }

    private async Task CancelPendingNotificationsAsync(Guid bookingId)
    {
        var pending = await _db.Notifications
            .Where(n => n.BookingId == bookingId
                && (n.Status == NotificationStatus.Pending))
            .ToListAsync();

        foreach (var notification in pending)
        {
            notification.Status = NotificationStatus.Cancelled;

            if (!string.IsNullOrEmpty(notification.HangfireJobId))
            {
                try
                {
                    BackgroundJob.Delete(notification.HangfireJobId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete Hangfire job {JobId}", notification.HangfireJobId);
                }
            }
        }

        if (pending.Count > 0)
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Cancelled {Count} pending notifications for booking {BookingId}",
                pending.Count, bookingId);
        }
    }

    private async Task EnqueueAuthEmailAsync(string email, string subject, string body)
    {
        // For auth emails, we enqueue directly without a Notification record
        _jobClient.Enqueue<IEmailSender>(sender =>
            sender.SendEmailAsync(email, subject, body));

        _logger.LogInformation("Enqueued auth email to {Email} — subject: {Subject}", email, subject);
        await Task.CompletedTask;
    }

    private static string BuildBookingHtml(Booking booking, string kaTitle, string enTitle, string kaMessage, string enMessage)
    {
        var serviceRows = string.Join("", booking.BookingServices.Select(bs =>
        {
            var name = bs.MasterService?.Service?.Name ?? "მომსახურება / Service";
            return "<tr>" +
                $"<td style=\"padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;\">{name}</td>" +
                $"<td style=\"padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#6E6259;white-space:nowrap;\">{bs.DurationMinutes} წთ / min</td>" +
                $"<td style=\"padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#B8623A;font-weight:600;text-align:right;white-space:nowrap;\">{bs.Price:F2} ₾</td>" +
                "</tr>";
        }));

        return WrapEmail($"""
            <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#1A1614;">{kaTitle}</h2>
            <p style="margin:0 0 4px;font-size:13px;color:#B8623A;font-weight:500;letter-spacing:.5px;text-transform:uppercase;">{enTitle}</p>
            <div style="height:1px;background:#E8E2DA;margin:16px 0 24px;"></div>

            <p style="margin:0 0 4px;color:#1A1614;">გამარჯობა, <strong>{booking.ClientName}</strong>!</p>
            <p style="margin:0 0 8px;color:#1A1614;">{kaMessage}</p>
            <p style="margin:0 0 24px;font-size:13px;color:#6E6259;">{enMessage}</p>

            <table style="width:100%;border-collapse:collapse;background:#FAF8F5;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:13px;color:#6E6259;width:38%;">სალონი / Salon</td>
                <td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;font-weight:500;">{booking.Salon?.Name}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:13px;color:#6E6259;">თარიღი / Date</td>
                <td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;">{booking.BookingDate:dd MMM yyyy}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:13px;color:#6E6259;">დრო / Time</td>
                <td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;">{booking.StartTime:HH:mm} – {booking.EndTime:HH:mm}</td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1A1614;">მომსახურებები / Services</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
              <thead>
                <tr style="background:#FBF0E8;">
                  <th style="padding:8px 12px;text-align:left;font-size:12px;color:#B8623A;font-weight:600;">მომსახურება</th>
                  <th style="padding:8px 12px;text-align:left;font-size:12px;color:#B8623A;font-weight:600;">ხანგრძლივობა</th>
                  <th style="padding:8px 12px;text-align:right;font-size:12px;color:#B8623A;font-weight:600;">ფასი</th>
                </tr>
              </thead>
              <tbody>{serviceRows}</tbody>
            </table>
            <div style="background:#B8623A;border-radius:0 0 10px 10px;padding:12px 16px;display:flex;justify-content:space-between;">
              <span style="color:#FFFFFF;font-size:14px;font-weight:600;">სულ / Total</span>
              <span style="color:#FFFFFF;font-size:16px;font-weight:700;">{booking.TotalPrice:F2} ₾</span>
            </div>
            """);
    }

    private static string WrapEmail(string content) => $"""
        <!DOCTYPE html>
        <html lang="ka">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#FAF8F5;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                <!-- Header -->
                <tr>
                  <td style="background:#B8623A;border-radius:14px 14px 0 0;padding:24px 32px;">
                    <span style="font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">Bookio</span>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="background:#FFFFFF;padding:32px;border-left:1px solid #E8E2DA;border-right:1px solid #E8E2DA;">
                    {content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#FAF8F5;border:1px solid #E8E2DA;border-top:none;border-radius:0 0 14px 14px;padding:16px 32px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#A69B90;">© 2026 Bookio · ეს ავტომატური შეტყობინებაა / This is an automated message</p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
}

