using BeautySalonBooking.Domain.Enums;

namespace BeautySalonBooking.Domain.Entities;

public class TimeSlot
{
    public Guid Id { get; set; }
    public Guid SalonMasterId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public TimeSlotStatus Status { get; set; } = TimeSlotStatus.Available;

    public SalonMaster SalonMaster { get; set; } = null!;
}
