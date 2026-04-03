using BeautySalonBooking.Domain.Enums;

namespace BeautySalonBooking.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public NotificationType Type { get; set; }
    public NotificationChannel Channel { get; set; }
    public NotificationStatus Status { get; set; } = NotificationStatus.Pending;
    public string? RecipientEmail { get; set; }
    public string? RecipientPhone { get; set; }
    public string? Subject { get; set; }
    public string? Body { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime? SentAt { get; set; }
    public int AttemptCount { get; set; }
    public DateTime? LastAttemptAt { get; set; }
    public string? FailureReason { get; set; }
    public string? HangfireJobId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Booking Booking { get; set; } = null!;
}
