namespace Bookio.Domain.Enums;

public enum NotificationType
{
    Reminder24h,
    Reminder3h,
    BookingConfirmation,
    BookingCancelled,
    BookingCompleted,
    BookingPendingApproval,
    BookingApprovalReminder,
    BookingExpired,
    PasswordReset,
    PasswordChanged,
    AccountCredentials
}
