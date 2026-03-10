namespace BeautySalonBooking.Application.Interfaces;

public enum CancellationSide { Client, Master }

public interface INotificationService
{
    /// <summary>Notifies the master that a new booking is awaiting their approval.</summary>
    Task SendBookingPendingApprovalAsync(Guid bookingId);

    /// <summary>Notifies the client that their booking has been confirmed (auto or manually by master).</summary>
    Task SendBookingConfirmedAsync(Guid bookingId);

    /// <summary>Notifies both parties that the booking was cancelled.</summary>
    Task SendBookingCancelledAsync(Guid bookingId, CancellationSide cancelledBy);

    /// <summary>Notifies the client that their appointment has been marked complete.</summary>
    Task SendBookingCompletedAsync(Guid bookingId);

    /// <summary>Reminder sent one day before the appointment.</summary>
    Task SendReminderOneDayBeforeAsync(Guid bookingId);

    /// <summary>Reminder sent two hours before the appointment.</summary>
    Task SendReminderTwoHoursBeforeAsync(Guid bookingId);
}
