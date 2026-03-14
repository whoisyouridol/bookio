namespace BeautySalonBooking.Application.DTOs;

public record SalonMasterDto(
    Guid Id,
    Guid SalonId,
    Guid MasterId,
    string MasterFirstName,
    string MasterLastName,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays,
    bool IsActive
);

public record LinkMasterToSalonRequest(
    Guid MasterId,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays
);

public record SalonMasterWithSalonDto(
    Guid Id,
    Guid SalonId,
    Guid MasterId,
    string SalonName,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays,
    bool IsActive
);

public record UpdateSalonMasterRequest(
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays
);
