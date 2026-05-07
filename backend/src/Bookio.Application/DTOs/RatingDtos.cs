namespace Bookio.Application.DTOs;

public record RatingDto(
    Guid Id,
    Guid MasterId,
    Guid? BookingId,
    string ClientName,
    int Rating,
    string? Comment,
    DateTime CreatedAt
);

public record CreateRatingRequest(
    Guid? BookingId,
    string ClientName,
    int Rating,
    string? Comment
);

public record AverageRatingDto(double Average, int Count);
