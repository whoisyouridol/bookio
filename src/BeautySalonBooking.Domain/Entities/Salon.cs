namespace BeautySalonBooking.Domain.Entities;

public class Salon
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? GoogleMapsUrl { get; set; }
    public string? YandexMapsUrl { get; set; }
    public TimeOnly WorkingHoursStart { get; set; }
    public TimeOnly WorkingHoursEnd { get; set; }
    public List<DayOfWeek> WorkingDays { get; set; } = new();
    public List<string> Photos { get; set; } = new();
    public List<string> Videos { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<SalonMaster> SalonMasters { get; set; } = new List<SalonMaster>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
