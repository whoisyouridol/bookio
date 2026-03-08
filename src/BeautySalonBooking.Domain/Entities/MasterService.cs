namespace BeautySalonBooking.Domain.Entities;

public class MasterService
{
    public Guid Id { get; set; }
    public Guid MasterId { get; set; }
    public Guid ServiceId { get; set; }
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsActive { get; set; } = true;

    public Master Master { get; set; } = null!;
    public Service Service { get; set; } = null!;
    public ICollection<BookingService> BookingServices { get; set; } = new List<BookingService>();
}
