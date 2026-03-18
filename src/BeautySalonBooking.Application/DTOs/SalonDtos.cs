namespace BeautySalonBooking.Application.DTOs;

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
    List<string> Photos,
    List<string> Videos,
    string? PrimaryColor,
    string? AccentColor,
    string? BorderRadius,
    string? LogoUrl,
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
    List<string> Photos,
    List<string> Videos,
    string? PrimaryColor,
    string? AccentColor,
    string? BorderRadius,
    string? LogoUrl,
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
    List<string>? Photos,
    List<string>? Videos,
    string? PrimaryColor,
    string? AccentColor,
    string? BorderRadius,
    string? LogoUrl
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
    List<string>? Photos,
    List<string>? Videos,
    string? PrimaryColor,
    string? AccentColor,
    string? BorderRadius,
    string? LogoUrl
);
