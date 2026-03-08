using BeautySalonBooking.Domain.Enums;

namespace BeautySalonBooking.Domain.Entities;

public class Booking
{
    public Guid Id { get; set; }
    public Guid SalonId { get; set; }
    public Guid MasterId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public string? ClientEmail { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal TotalPrice { get; set; }
    public int TotalDurationMinutes { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    public Salon Salon { get; set; } = null!;
    public Master Master { get; set; } = null!;
    public ICollection<BookingService> BookingServices { get; set; } = new List<BookingService>();
    public MasterRating? Rating { get; set; }
}
