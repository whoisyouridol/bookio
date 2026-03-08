namespace BeautySalonBooking.Application.DTOs;

public record MasterServiceDto(
    Guid Id,
    Guid MasterId,
    Guid ServiceId,
    string ServiceName,
    string? ServicePhoto,
    decimal Price,
    int DurationMinutes,
    bool IsActive
);

public record AddMasterServiceRequest(Guid ServiceId, decimal Price, int DurationMinutes);
public record UpdateMasterServiceRequest(decimal Price, int DurationMinutes);
