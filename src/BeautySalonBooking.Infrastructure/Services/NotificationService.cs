using BeautySalonBooking.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger) => _logger = logger;

    public Task SendBookingPendingApprovalAsync(Guid bookingId)
    {
        _logger.LogInformation("TODO: Notify master — booking {BookingId} awaits approval", bookingId);
        return Task.CompletedTask;
    }

    public Task SendBookingConfirmedAsync(Guid bookingId)
    {
        _logger.LogInformation("TODO: Notify client — booking {BookingId} confirmed", bookingId);
        return Task.CompletedTask;
    }

    public Task SendBookingCancelledAsync(Guid bookingId, CancellationSide cancelledBy)
    {
        _logger.LogInformation("TODO: Notify both parties — booking {BookingId} cancelled by {Side}", bookingId, cancelledBy);
        return Task.CompletedTask;
    }

    public Task SendBookingCompletedAsync(Guid bookingId)
    {
        _logger.LogInformation("TODO: Notify client — booking {BookingId} completed", bookingId);
        return Task.CompletedTask;
    }

    public Task SendReminderOneDayBeforeAsync(Guid bookingId)
    {
        _logger.LogInformation("TODO: Send 1-day reminder for {BookingId}", bookingId);
        return Task.CompletedTask;
    }

    public Task SendReminderTwoHoursBeforeAsync(Guid bookingId)
    {
        _logger.LogInformation("TODO: Send 2-hour reminder for {BookingId}", bookingId);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string email, string resetToken)
    {
        _logger.LogInformation("TODO: Send password-reset link to {Email} — token: {Token}", email, resetToken);
        return Task.CompletedTask;
    }

    public Task SendPasswordChangedAsync(string email)
    {
        _logger.LogInformation("TODO: Notify {Email} that their password was changed", email);
        return Task.CompletedTask;
    }
}
