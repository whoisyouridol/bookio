namespace BeautySalonBooking.Application.DTOs;

public record ServiceDto(
    Guid Id,
    string Name,
    string? Description,
    string? Photo,
    DateTime CreatedAt
);

public record CreateServiceRequest(string Name, string? Description, string? Photo);
public record UpdateServiceRequest(string Name, string? Description, string? Photo);
