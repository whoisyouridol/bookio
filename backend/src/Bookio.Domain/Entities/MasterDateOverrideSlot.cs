namespace Bookio.Domain.Entities;

public class MasterDateOverrideSlot
{
    public Guid Id { get; set; }
    public Guid DateOverrideId { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public MasterDateOverride DateOverride { get; set; } = null!;
}
