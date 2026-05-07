namespace Bookio.Application.DTOs;

public record SalonDto(
    Guid Id,
    string Name,
    string? Slug,
    string Address,
    string? GoogleMapsUrl,
    string? YandexMapsUrl,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays,
    string? CoverPicture,
    bool IsActive,
    DateTime CreatedAt
);

public record SalonDetailDto(
    Guid Id,
    string Name,
    string? Slug,
    string Address,
    string? GoogleMapsUrl,
    string? YandexMapsUrl,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays,
    string? CoverPicture,
    bool IsActive,
    DateTime CreatedAt,
    List<SalonMasterDto> Masters
);

public record CreateSalonRequest(
    string Name,
    string? Slug,
    string Address,
    string? GoogleMapsUrl,
    string? YandexMapsUrl,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays,
    string? CoverPicture
);

public record UpdateSalonRequest(
    string Name,
    string? Slug,
    string Address,
    string? GoogleMapsUrl,
    string? YandexMapsUrl,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays,
    string? CoverPicture
);
