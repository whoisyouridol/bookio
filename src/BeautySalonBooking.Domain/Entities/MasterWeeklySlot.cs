namespace BeautySalonBooking.Domain.Entities;

public class MasterWeeklySlot
{
    public Guid Id { get; set; }
    public Guid SalonMasterId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public SalonMaster SalonMaster { get; set; } = null!;
}
