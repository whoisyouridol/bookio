namespace Bookio.Domain.Entities;

public class MasterDateOverride
{
    public Guid Id { get; set; }
    public Guid SalonMasterId { get; set; }
    public DateOnly Date { get; set; }

    /// <summary>If true, the master is completely off on this date (ignores slots).</summary>
    public bool IsDayOff { get; set; }

    public SalonMaster SalonMaster { get; set; } = null!;
    public ICollection<MasterDateOverrideSlot> Slots { get; set; } = new List<MasterDateOverrideSlot>();
}
