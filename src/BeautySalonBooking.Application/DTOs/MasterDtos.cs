namespace BeautySalonBooking.Application.DTOs;

public record MasterDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string? Phone,
    string? Photo,
    string? Description,
    bool AutoApproveBookings,
    bool IsDeleted,
    /// <summary>Whether the linked user account is active (false = pending SuperAdmin activation)</summary>
    bool IsUserActive,
    DateTime CreatedAt,
    double? AverageRating,
    int RatingCount
);

public record CreateMasterRequest(
    string Email,
    string FirstName,
    string LastName,
    string Phone,
    string? Photo,
    string? Description,
    bool AutoApproveBookings = true
);

public record UpdateMasterRequest(
    string? Photo,
    string? Description,
    bool AutoApproveBookings = true
);
