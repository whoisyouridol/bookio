namespace Bookio.Domain.Entities;

public class Master
{
    public Guid Id { get; set; }

    /// <summary>FK to AspNetUsers. Nullable to support legacy/seed masters without a linked account.</summary>
    public Guid? UserId { get; set; }

    public string? Photo { get; set; }
    public string? Description { get; set; }
    public bool AutoApproveBookings { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<SalonMaster> SalonMasters { get; set; } = new List<SalonMaster>();
    public ICollection<MasterService> MasterServices { get; set; } = new List<MasterService>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<MasterRating> Ratings { get; set; } = new List<MasterRating>();
}
