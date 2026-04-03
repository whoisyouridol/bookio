namespace BeautySalonBooking.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(
        Guid userId,
        string? email,
        string role,
        string? firstName,
        string? lastName,
        Guid? salonId,
        Guid? masterId);

    string GenerateRefreshToken();
}
