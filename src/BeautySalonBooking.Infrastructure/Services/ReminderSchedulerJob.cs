using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Persistence;
using BeautySalonBooking.Infrastructure.Resources;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.Services;

public class ReminderSchedulerJob
{
    private readonly AppDbContext _db;
    private readonly IBackgroundJobClient _jobClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ReminderSchedulerJob> _logger;
    private readonly EmailMessages _msg;
    private readonly SmsMessages _sms;

    public ReminderSchedulerJob(
        AppDbContext db,
        IBackgroundJobClient jobClient,
        IConfiguration configuration,
        ILogger<ReminderSchedulerJob> logger,
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

    public async Task ScanAndScheduleMissingRemindersAsync()
    {
        var tzOffsetHours = _configuration.GetValue<int>("Booking:TimezoneOffsetHours", 4);
        var tzOffset = TimeSpan.FromHours(tzOffsetHours);
        var utcNow = DateTime.UtcNow;

        // Look for confirmed bookings within the next 25 hours
        var cutoffLocal = utcNow.Add(tzOffset).AddHours(25);
        var cutoffDate = DateOnly.FromDateTime(cutoffLocal);

        var bookings = await _db.Bookings
            .Include(b => b.Salon)
            .Include(b => b.Master)
            .Include(b => b.BookingServices)
                .ThenInclude(bs => bs.MasterService)
                    .ThenInclude(ms => ms.Service)
            .Include(b => b.Notifications)
            .Where(b => b.Status == BookingStatus.Confirmed
                && b.BookingDate <= cutoffDate
                && b.BookingDate >= DateOnly.FromDateTime(utcNow.Add(tzOffset)))
            .ToListAsync();

        var scheduled = 0;

        foreach (var booking in bookings)
        {
            var appointmentLocalDt = booking.BookingDate.ToDateTime(booking.StartTime);
            var appointmentUtc = DateTime.SpecifyKind(appointmentLocalDt - tzOffset, DateTimeKind.Utc);

            // Skip if appointment is already in the past
            if (appointmentUtc <= utcNow) continue;

            // 24-hour reminder
            scheduled += await EnsureReminderAsync(booking, NotificationType.Reminder24h, appointmentUtc.AddHours(-24));

            // 3-hour reminder
            scheduled += await EnsureReminderAsync(booking, NotificationType.Reminder3h, appointmentUtc.AddHours(-3));
        }

        if (scheduled > 0)
            _logger.LogInformation("ReminderScheduler: created {Count} reminder notifications", scheduled);
    }

    private async Task<int> EnsureReminderAsync(Booking booking, NotificationType type, DateTime scheduledUtc)
    {
        if (scheduledUtc <= DateTime.UtcNow) return 0;

        var hasPhone = !string.IsNullOrEmpty(booking.ClientPhone);
        var hasEmail = !string.IsNullOrEmpty(booking.ClientEmail);
        if (!hasPhone && !hasEmail) return 0;

        var scheduled = 0;
        var msgKey = type == NotificationType.Reminder24h ? "reminder24h" : "reminder3h";

        // SMS reminder
        if (hasPhone)
        {
            var smsExists = booking.Notifications.Any(n =>
                n.Type == type && n.Channel == NotificationChannel.Sms
                && n.Status != NotificationStatus.Cancelled);

            if (!smsExists)
            {
                var placeholders = new Dictionary<string, string>
                {
                    ["salonName"] = booking.Salon?.Name ?? "",
                    ["time"] = booking.StartTime.ToString("HH:mm"),
                    ["date"] = booking.BookingDate.ToString("dd.MM.yyyy")
                };
                scheduled += await ScheduleNotificationAsync(booking, type, NotificationChannel.Sms,
                    scheduledUtc, null, _sms.Format(msgKey, "toClient", placeholders),
                    booking.ClientPhone, null);
            }
        }

        // Email reminder
        if (hasEmail)
        {
            var emailExists = booking.Notifications.Any(n =>
                n.Type == type && n.Channel == NotificationChannel.Email
                && n.Status != NotificationStatus.Cancelled);

            if (!emailExists)
            {
                var subject = _msg.Get(msgKey, "subject");
                var body = BuildReminderEmailHtml(booking, msgKey);
                scheduled += await ScheduleNotificationAsync(booking, type, NotificationChannel.Email,
                    scheduledUtc, subject, body, null, booking.ClientEmail);
            }
        }

        return scheduled;
    }

    private async Task<int> ScheduleNotificationAsync(
        Booking booking, NotificationType type, NotificationChannel channel,
        DateTime scheduledUtc, string? subject, string body,
        string? phone, string? email)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Type = type,
            Channel = channel,
            Status = NotificationStatus.Pending,
            RecipientPhone = phone,
            RecipientEmail = email,
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

        _logger.LogInformation("Scheduled {Channel} {Type} reminder for booking {BookingId} at {ScheduledAt}",
            channel, type, booking.Id, scheduledUtc);

        return 1;
    }

    private string BuildReminderEmailHtml(Booking booking, string msgKey)
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

        return $"""
            <!DOCTYPE html>
            <html lang="ka">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#FAF8F5;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:32px 16px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                    <tr><td style="background:#B8623A;border-radius:14px 14px 0 0;padding:24px 32px;">
                      <span style="font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">BookVisit</span>
                    </td></tr>
                    <tr><td style="background:#FFFFFF;padding:32px;border-left:1px solid #E8E2DA;border-right:1px solid #E8E2DA;">
                      <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#1A1614;">{_msg.Get(msgKey, "kaTitle")}</h2>
                      <p style="margin:0 0 4px;font-size:13px;color:#B8623A;font-weight:500;letter-spacing:.5px;text-transform:uppercase;">{_msg.Get(msgKey, "enTitle")}</p>
                      <div style="height:1px;background:#E8E2DA;margin:16px 0 24px;"></div>
                      <p style="margin:0 0 4px;color:#1A1614;">გამარჯობა, <strong>{booking.ClientName}</strong>!</p>
                      <p style="margin:0 0 8px;color:#1A1614;">{_msg.Get(msgKey, "kaMessage")}</p>
                      <p style="margin:0 0 24px;font-size:13px;color:#6E6259;">{_msg.Get(msgKey, "enMessage")}</p>
                      <table style="width:100%;border-collapse:collapse;background:#FAF8F5;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                        <tr><td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:13px;color:#6E6259;width:38%;">{_msg.Label("salon")}</td><td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;font-weight:500;">{booking.Salon?.Name}</td></tr>
                        <tr><td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:13px;color:#6E6259;">{_msg.Label("date")}</td><td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;">{booking.BookingDate:dd MMM yyyy}</td></tr>
                        <tr><td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:13px;color:#6E6259;">{_msg.Label("time")}</td><td style="padding:10px 12px;border-bottom:1px solid #E8E2DA;font-size:14px;color:#1A1614;">{booking.StartTime:HH:mm} – {booking.EndTime:HH:mm}</td></tr>
                      </table>
                      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1A1614;">{_msg.Label("services")}</p>
                      <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
                        <thead><tr style="background:#FBF0E8;">
                          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#B8623A;font-weight:600;">მომსახურება</th>
                          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#B8623A;font-weight:600;">ხანგრძლივობა</th>
                          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#B8623A;font-weight:600;">ფასი</th>
                        </tr></thead>
                        <tbody>{serviceRows}</tbody>
                      </table>
                      <div style="background:#B8623A;border-radius:0 0 10px 10px;padding:12px 16px;display:flex;justify-content:space-between;">
                        <span style="color:#FFFFFF;font-size:14px;font-weight:600;">{_msg.Label("total")}</span>
                        <span style="color:#FFFFFF;font-size:16px;font-weight:700;">{booking.TotalPrice:F2} ₾</span>
                      </div>
                    </td></tr>
                    <tr><td style="background:#FAF8F5;border:1px solid #E8E2DA;border-top:none;border-radius:0 0 14px 14px;padding:16px 32px;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#A69B90;">{_msg.Label("footer")}</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }

}
