using BeautySalonBooking.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendBookingConfirmationAsync(Guid bookingId)
    {
        _logger.LogInformation("TODO: Send booking confirmation for {BookingId}", bookingId);
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

    public Task SendCancellationNotificationAsync(Guid bookingId, CancellationSide side)
    {
        _logger.LogInformation("TODO: Send cancellation notification for {BookingId}, cancelled by {Side}", bookingId, side);
        return Task.CompletedTask;
    }
}
