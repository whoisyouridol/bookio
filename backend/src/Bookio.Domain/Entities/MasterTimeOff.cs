namespace Bookio.Domain.Entities;

public class MasterTimeOff
{
    public Guid Id { get; set; }
    public Guid SalonMasterId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? Reason { get; set; }

    public SalonMaster SalonMaster { get; set; } = null!;
}
