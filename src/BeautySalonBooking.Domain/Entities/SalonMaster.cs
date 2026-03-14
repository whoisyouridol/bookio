namespace BeautySalonBooking.Domain.Entities;

public class SalonMaster
{
    public Guid Id { get; set; }
    public Guid SalonId { get; set; }
    public Guid MasterId { get; set; }
    public TimeOnly WorkingHoursStart { get; set; }
    public TimeOnly WorkingHoursEnd { get; set; }
    public List<DayOfWeek> WorkingDays { get; set; } = new();
    public bool IsActive { get; set; } = true;

    public Salon Salon { get; set; } = null!;
    public Master Master { get; set; } = null!;
    public ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();
    public ICollection<MasterWeeklySlot> WeeklySlots { get; set; } = new List<MasterWeeklySlot>();
    public ICollection<MasterDateOverride> DateOverrides { get; set; } = new List<MasterDateOverride>();
    public ICollection<MasterTimeOff> TimeOffs { get; set; } = new List<MasterTimeOff>();
}
