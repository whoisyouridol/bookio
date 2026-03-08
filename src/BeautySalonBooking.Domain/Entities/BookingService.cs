namespace BeautySalonBooking.Domain.Entities;

public class BookingService
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid MasterServiceId { get; set; }
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }

    public Booking Booking { get; set; } = null!;
    public MasterService MasterService { get; set; } = null!;
}
