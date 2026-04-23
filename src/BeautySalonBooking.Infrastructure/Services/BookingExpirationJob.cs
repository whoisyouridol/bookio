using BeautySalonBooking.Application.Interfaces;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.Services;

/// <summary>
/// Hangfire recurring job that handles pending booking expiration.
///
/// Business rules (for masters without auto-approve):
///   - At 3 hours: send a reminder to the master to confirm the booking.
///   - At 6 hours: auto-expire the booking, free the time slot, notify both parties.
/// </summary>
public class BookingExpirationJob
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;
    private readonly ILogger<BookingExpirationJob> _logger;

    private static readonly TimeSpan ReminderThreshold = TimeSpan.FromHours(3);
    private static readonly TimeSpan ExpirationThreshold = TimeSpan.FromHours(6);

    public BookingExpirationJob(
        AppDbContext db,
        INotificationService notifications,
        ILogger<BookingExpirationJob> logger)
    {
        _db = db;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task ProcessPendingBookingsAsync()
    {
        var utcNow = DateTime.UtcNow;

        // Find all pending bookings (non-auto-approve masters only create Pending bookings)
        var pendingBookings = await _db.Bookings
            .Include(b => b.Notifications)
            .Where(b => b.Status == BookingStatus.Pending)
            .ToListAsync();

        foreach (var booking in pendingBookings)
        {
            var age = utcNow - booking.CreatedAt;

            if (age >= ExpirationThreshold)
            {
                // Auto-expire: master didn't act within 6 hours
                booking.Status = BookingStatus.Expired;
                booking.CancelledAt = utcNow;
                booking.CancellationReason = "Booking expired — master did not confirm within 6 hours";
                booking.UpdatedAt = utcNow;

                await _db.SaveChangesAsync();

                await _notifications.SendBookingExpiredAsync(booking.Id);

                _logger.LogInformation(
                    "Booking {BookingId} expired after {Hours:F1}h without confirmation",
                    booking.Id, age.TotalHours);
            }
            else if (age >= ReminderThreshold)
            {
                // Send approval reminder if not already sent
                var alreadyReminded = booking.Notifications.Any(n =>
                    n.Type == NotificationType.BookingApprovalReminder
                    && n.Status != NotificationStatus.Cancelled);

                if (!alreadyReminded)
                {
                    await _notifications.SendBookingApprovalReminderAsync(booking.Id);

                    _logger.LogInformation(
                        "Sent approval reminder for booking {BookingId} (age: {Hours:F1}h)",
                        booking.Id, age.TotalHours);
                }
            }
        }
    }
}
