namespace Bookio.Domain.Enums;

public enum BookingStatus
{
    Pending,
    Confirmed,
    Completed,
    CancelledByClient,
    CancelledByMaster,
    Expired
}
