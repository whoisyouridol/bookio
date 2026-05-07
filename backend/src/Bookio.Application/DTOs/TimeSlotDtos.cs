namespace Bookio.Application.DTOs;

public record TimeSlotDto(
    Guid Id,
    Guid SalonMasterId,
    string Date,
    string StartTime,
    string EndTime,
    string Status
);
