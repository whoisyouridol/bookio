namespace BeautySalonBooking.Application.DTOs;

public record MasterServiceDto(
    Guid Id,
    Guid MasterId,
    Guid ServiceId,
    string ServiceName,
    string? ServicePhoto,
    string? Photo,
    string? Description,
    decimal Price,
    int DurationMinutes,
    bool IsActive
);

public record AddMasterServiceRequest(Guid ServiceId, decimal Price, int DurationMinutes, string? Photo = null, string? Description = null);
public record UpdateMasterServiceRequest(decimal Price, int DurationMinutes, string? Photo = null, bool ClearPhoto = false, string? Description = null);
