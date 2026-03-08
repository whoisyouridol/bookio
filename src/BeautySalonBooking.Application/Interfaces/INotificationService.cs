namespace BeautySalonBooking.Application.Interfaces;

public enum CancellationSide { Client, Master }

public interface INotificationService
{
    Task SendBookingConfirmationAsync(Guid bookingId);
    Task SendReminderOneDayBeforeAsync(Guid bookingId);
    Task SendReminderTwoHoursBeforeAsync(Guid bookingId);
    Task SendCancellationNotificationAsync(Guid bookingId, CancellationSide side);
}
