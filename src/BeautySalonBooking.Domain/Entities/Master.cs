namespace BeautySalonBooking.Domain.Entities;

public class Master
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Photo { get; set; }
    public string? Description { get; set; }
    public bool AutoApproveBookings { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<SalonMaster> SalonMasters { get; set; } = new List<SalonMaster>();
    public ICollection<MasterService> MasterServices { get; set; } = new List<MasterService>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<MasterRating> Ratings { get; set; } = new List<MasterRating>();
}
