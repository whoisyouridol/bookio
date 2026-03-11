namespace BeautySalonBooking.Application.DTOs;

public record MasterDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Phone,
    string? Photo,
    string? Description,
    bool AutoApproveBookings,
    bool IsDeleted,
    DateTime CreatedAt,
    double? AverageRating,
    int RatingCount
);

public record CreateMasterRequest(
    string FirstName,
    string LastName,
    string Phone,
    string? Photo,
    string? Description,
    bool AutoApproveBookings = true
);

public record UpdateMasterRequest(
    string FirstName,
    string LastName,
    string Phone,
    string? Photo,
    string? Description,
    bool AutoApproveBookings = true
);
