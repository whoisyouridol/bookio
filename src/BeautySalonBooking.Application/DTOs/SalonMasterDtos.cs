namespace BeautySalonBooking.Application.DTOs;

public record SalonMasterDto(
    Guid Id,
    Guid SalonId,
    Guid MasterId,
    string MasterFirstName,
    string MasterLastName,
    bool IsActive
);

public record LinkMasterToSalonRequest(
    Guid MasterId
);

public record SalonMasterWithSalonDto(
    Guid Id,
    Guid SalonId,
    Guid MasterId,
    string SalonName,
    bool IsActive
);
