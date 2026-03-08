namespace BeautySalonBooking.Application.DTOs;

public record MasterDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Phone,
    string? Photo,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    double? AverageRating,
    int RatingCount
);

public record CreateMasterRequest(
    string FirstName,
    string LastName,
    string Phone,
    string? Photo,
    string? Description
);

public record UpdateMasterRequest(
    string FirstName,
    string LastName,
    string Phone,
    string? Photo,
    string? Description
);
