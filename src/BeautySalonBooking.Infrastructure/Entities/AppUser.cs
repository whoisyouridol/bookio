using BeautySalonBooking.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace BeautySalonBooking.Infrastructure.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public AppRole Role { get; set; } = AppRole.Client;

    /// <summary>For SalonAdmin: the salon they manage.</summary>
    public Guid? SalonId { get; set; }

    /// <summary>For MasterAdmin: the master profile they own.</summary>
    public Guid? MasterId { get; set; }

    /// <summary>"Google" | "Facebook" — null for email/password accounts.</summary>
    public string? ExternalProvider { get; set; }

    public string? ExternalProviderId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
