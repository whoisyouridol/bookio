namespace BeautySalonBooking.Application.DTOs;

public record TimeSlotDto(
    Guid Id,
    Guid SalonMasterId,
    string Date,
    string StartTime,
    string EndTime,
    string Status
);

public record CreateTimeSlotsRequest(
    string Date,
    List<TimeSlotItemRequest> Slots
);

public record TimeSlotItemRequest(string StartTime, string EndTime);

public record GenerateSlotsRequest(
    string StartDate,
    string EndDate,
    int SlotDurationMinutes
);

public record UpdateSlotStatusRequest(string Status);
