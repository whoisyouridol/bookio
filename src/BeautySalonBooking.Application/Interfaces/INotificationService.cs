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

    /// <summary>Reminds the master to confirm a pending booking (sent at 3 hours).</summary>
    Task SendBookingApprovalReminderAsync(Guid bookingId);

    /// <summary>Notifies both parties that a booking expired because the master didn't confirm in time.</summary>
    Task SendBookingExpiredAsync(Guid bookingId);

    /// <summary>Reminder sent one day before the appointment.</summary>
    Task SendReminderOneDayBeforeAsync(Guid bookingId);

    /// <summary>Reminder sent two hours before the appointment.</summary>
    Task SendReminderTwoHoursBeforeAsync(Guid bookingId);

    /// <summary>Sends a password-reset link to the user's email.</summary>
    Task SendPasswordResetAsync(string email, string resetToken);

    /// <summary>Notifies the user that their password was changed successfully.</summary>
    Task SendPasswordChangedAsync(string email);

    /// <summary>Sends generated credentials to a master created by an admin.</summary>
    Task SendMasterCredentialsAsync(string email, string temporaryPassword);

    /// <summary>Sends generated credentials to any account created by an admin.</summary>
    Task SendAccountCredentialsAsync(string email, string temporaryPassword, string role);
}
