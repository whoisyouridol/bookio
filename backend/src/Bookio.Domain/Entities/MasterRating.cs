namespace Bookio.Domain.Entities;

public class MasterRating
{
    public Guid Id { get; set; }
    public Guid MasterId { get; set; }
    public Guid? BookingId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }

    public Master Master { get; set; } = null!;
    public Booking? Booking { get; set; }
}
