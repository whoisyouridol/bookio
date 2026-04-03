namespace BeautySalonBooking.Application.DTOs;

public record SalonAdminDashboardDto(
    int ActiveMasters,
    int PendingMasters,
    int BookingsToday,
    int BookingsThisWeek,
    int BookingsThisMonth,
    decimal RevenueToday,
    decimal RevenueThisWeek,
    decimal RevenueThisMonth,
    double CancellationRate30d,
    double AverageRating,
    List<PendingMasterDto> PendingMastersList);

public record PendingMasterDto(
    Guid UserId,
    string Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string? ExternalProvider,
    DateTime CreatedAt);

public record LinkExistingMasterRequest(Guid MasterId);

public record SalonAdminMasterDto(
    Guid MasterId,
    Guid? UserId,
    string Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string? Photo,
    bool IsUserActive,
    bool IsDeleted,
    double? AverageRating,
    int RatingCount,
    int ServicesCount,
    DateTime CreatedAt);
