namespace Bookio.Application.DTOs;

public record BookingDto(
    Guid Id,
    Guid SalonId,
    string SalonName,
    Guid MasterId,
    string MasterName,
    string ClientName,
    string? ClientPhone,
    string? ClientEmail,
    string BookingDate,
    string StartTime,
    string EndTime,
    decimal TotalPrice,
    int TotalDurationMinutes,
    string Status,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    DateTime? CancelledAt,
    string? CancellationReason,
    List<BookingServiceDto> Services
);

public record BookingServiceDto(
    Guid Id,
    Guid ServiceId,
    string ServiceName,
    decimal Price,
    int DurationMinutes
);

public record CreateBookingRequest(
    Guid SalonId,
    Guid MasterId,
    string ClientName,
    string? ClientPhone,
    string? ClientEmail,
    string BookingDate,
    string StartTime,
    List<Guid> ServiceIds
);

public record CancelBookingRequest(string Side, string? Reason);

public record BookingFilterRequest(
    Guid? SalonId,
    Guid? MasterId,
    string? Status,
    string? DateFrom,
    string? DateTo
);
