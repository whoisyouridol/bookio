using System.Net.Http.Json;
using System.Text.Json.Serialization;
using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Application.Interfaces;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Entities;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class AuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;
    private readonly INotificationService _notifications;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _http;
    private readonly ILogger<AuthService> _logger;

    private const int RefreshTokenDays = 7;

    public AuthService(
        UserManager<AppUser> userManager,
        AppDbContext db,
        ITokenService tokens,
        INotificationService notifications,
        IConfiguration config,
        IHttpClientFactory http,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _db = db;
        _tokens = tokens;
        _notifications = notifications;
        _config = config;
        _http = http;
        _logger = logger;
    }

    // ── Register ──────────────────────────────────────────────────────────────

    public async Task<(AuthResponse? result, string? rawRefresh, string? error)> RegisterAsync(RegisterRequest req)
    {
        if (await _userManager.FindByEmailAsync(req.Email) != null)
            return (null, null, "Email is already registered");

        // SuperAdmin cannot be self-registered; anything unrecognised falls back to Client
        AppRole role = AppRole.Client;
        if (req.Role != null &&
            Enum.TryParse<AppRole>(req.Role, out var parsed) &&
            parsed != AppRole.SuperAdmin)
            role = parsed;

        var user = new AppUser
        {
            UserName = req.Email,
            Email = req.Email,
            FirstName = req.FirstName,
            LastName = req.LastName,
            PhoneNumber = req.Phone,
            Role = role,
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return (null, null, string.Join("; ", result.Errors.Select(e => e.Description)));

        var (response, rawRefresh) = await IssueTokensAsync(user);
        return (response, rawRefresh, null);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public async Task<(AuthResponse? result, string? rawRefresh, string? error)> LoginAsync(LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, req.Password))
            return (null, null, "Invalid email or password");

        var (response, rawRefresh) = await IssueTokensAsync(user);
        return (response, rawRefresh, null);
    }

    // ── Google OAuth ──────────────────────────────────────────────────────────

    public async Task<(AuthResponse? result, string? rawRefresh, string? error)> LoginWithGoogleAsync(GoogleAuthRequest req)
    {
        var (email, name, googleId) = await ValidateGoogleTokenAsync(req.Credential);
        if (email == null || googleId == null)
            return (null, null, "Invalid Google credential");

        var user = await FindOrCreateExternalUserAsync(email, name, "Google", googleId);
        var (response, rawRefresh) = await IssueTokensAsync(user);
        return (response, rawRefresh, null);
    }

    // ── Facebook OAuth ────────────────────────────────────────────────────────

    public async Task<(AuthResponse? result, string? rawRefresh, string? error)> LoginWithFacebookAsync(FacebookAuthRequest req)
    {
        var (email, name, fbId) = await ValidateFacebookTokenAsync(req.AccessToken);
        if (fbId == null)
            return (null, null, "Invalid Facebook access token");
        if (email == null)
            return (null, null, "Facebook account does not have a verified email address");

        var user = await FindOrCreateExternalUserAsync(email, name, "Facebook", fbId);
        var (response, rawRefresh) = await IssueTokensAsync(user);
        return (response, rawRefresh, null);
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    public async Task<(AuthResponse? result, string? rawRefresh, string? error)> RefreshAsync(string cookieToken)
    {
        var stored = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == cookieToken);

        if (stored == null || stored.IsRevoked || stored.ExpiresAt <= DateTime.UtcNow)
            return (null, null, "Invalid or expired refresh token");

        // Rotate — revoke old, issue new
        stored.IsRevoked = true;
        stored.RevokedAt = DateTime.UtcNow;

        var (response, rawRefresh) = await IssueTokensAsync(stored.User);
        return (response, rawRefresh, null);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    public async Task<bool> LogoutAsync(string cookieToken)
    {
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == cookieToken);
        if (stored == null) return false;
        stored.IsRevoked = true;
        stored.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Change Password ───────────────────────────────────────────────────────

    public async Task<(bool ok, string? error)> ChangePasswordAsync(Guid userId, ChangePasswordRequest req)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return (false, "User not found");
        if (user.ExternalProvider != null)
            return (false, "Password cannot be changed for social login accounts");

        var result = await _userManager.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
            return (false, string.Join("; ", result.Errors.Select(e => e.Description)));

        await _notifications.SendPasswordChangedAsync(user.Email!);
        return (true, null);
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    public async Task ForgotPasswordAsync(ForgotPasswordRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || user.ExternalProvider != null) return; // prevent enumeration

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        await _notifications.SendPasswordResetAsync(user.Email!, token);
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    public async Task<(bool ok, string? error)> ResetPasswordAsync(ResetPasswordRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null) return (false, "Invalid request");

        var result = await _userManager.ResetPasswordAsync(user, req.Token, req.NewPassword);
        if (!result.Succeeded)
            return (false, string.Join("; ", result.Errors.Select(e => e.Description)));

        return (true, null);
    }

    // ── Me ────────────────────────────────────────────────────────────────────

    public async Task<UserDto?> GetMeAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user == null ? null : MapUserDto(user);
    }

    // ── Admin: list / create / update role / delete ───────────────────────────

    public async Task<List<AdminUserDto>> GetAllUsersAsync()
    {
        var users = await _userManager.Users.OrderBy(u => u.Email).ToListAsync();
        return users.Select(MapAdminDto).ToList();
    }

    public async Task<(AdminUserDto? result, string? error)> CreateAdminUserAsync(CreateAdminUserRequest req)
    {
        if (!Enum.TryParse<AppRole>(req.Role, out var role) || role == AppRole.SuperAdmin)
            return (null, "Invalid role");
        if (await _userManager.FindByEmailAsync(req.Email) != null)
            return (null, "Email is already registered");

        var user = new AppUser
        {
            UserName = req.Email,
            Email = req.Email,
            EmailConfirmed = true,
            FirstName = req.FirstName,
            LastName = req.LastName,
            PhoneNumber = req.Phone,
            Role = role,
            SalonId = req.SalonId,
            MasterId = req.MasterId,
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return (null, string.Join("; ", result.Errors.Select(e => e.Description)));

        return (MapAdminDto(user), null);
    }

    public async Task<(AdminUserDto? result, string? error)> UpdateUserRoleAsync(Guid userId, UpdateUserRoleRequest req)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return (null, "User not found");
        if (!Enum.TryParse<AppRole>(req.Role, out var role) || role == AppRole.SuperAdmin)
            return (null, "Invalid role");

        user.Role = role;
        user.SalonId = req.SalonId;
        user.MasterId = req.MasterId;
        await _userManager.UpdateAsync(user);
        return (MapAdminDto(user), null);
    }

    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return false;
        await _userManager.DeleteAsync(user);
        return true;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    public async Task<(AuthResponse response, string rawRefreshToken)> IssueTokensAsync(AppUser user)
    {
        var accessToken = _tokens.GenerateAccessToken(
            user.Id, user.Email!, user.Role.ToString(),
            user.FirstName, user.LastName,
            user.SalonId, user.MasterId);

        var rawRefresh = _tokens.GenerateRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            Token = rawRefresh,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays),
        });
        await _db.SaveChangesAsync();

        return (new AuthResponse(accessToken, MapUserDto(user)), rawRefresh);
    }

    private async Task<AppUser> FindOrCreateExternalUserAsync(
        string email, string? name, string provider, string providerId)
    {
        var user = await _db.Set<AppUser>()
            .FirstOrDefaultAsync(u => u.ExternalProvider == provider && u.ExternalProviderId == providerId)
            ?? await _userManager.FindByEmailAsync(email);

        if (user != null)
        {
            if (user.ExternalProvider == null)
            {
                user.ExternalProvider = provider;
                user.ExternalProviderId = providerId;
                await _userManager.UpdateAsync(user);
            }
            return user;
        }

        var parts = name?.Split(' ', 2) ?? [];
        user = new AppUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = parts.Length > 0 ? parts[0] : null,
            LastName = parts.Length > 1 ? parts[1] : null,
            ExternalProvider = provider,
            ExternalProviderId = providerId,
            Role = AppRole.Client,
        };
        await _userManager.CreateAsync(user); // no password for social accounts
        return user;
    }

    // ── External provider validation ──────────────────────────────────────────

    private async Task<(string? Email, string? Name, string? GoogleId)> ValidateGoogleTokenAsync(string credential)
    {
        try
        {
            var client = _http.CreateClient();
            var resp = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={credential}");
            if (!resp.IsSuccessStatusCode) return default;

            var json = await resp.Content.ReadFromJsonAsync<GoogleTokenInfo>();
            if (json?.Email == null) return default;

            var clientId = _config["OAuth:Google:ClientId"];
            if (!string.IsNullOrEmpty(clientId) && json.Aud != clientId) return default;

            return (json.Email, json.Name, json.Sub);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Google token validation failed");
            return default;
        }
    }

    private async Task<(string? Email, string? Name, string? FacebookId)> ValidateFacebookTokenAsync(string accessToken)
    {
        try
        {
            var client = _http.CreateClient();
            var resp = await client.GetAsync(
                $"https://graph.facebook.com/me?fields=id,email,name&access_token={accessToken}");
            if (!resp.IsSuccessStatusCode) return default;

            var json = await resp.Content.ReadFromJsonAsync<FacebookUserInfo>();
            return (json?.Email, json?.Name, json?.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Facebook token validation failed");
            return default;
        }
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private static UserDto MapUserDto(AppUser u) => new(
        u.Id, u.Email!, u.FirstName, u.LastName, u.PhoneNumber,
        u.Role.ToString(), u.SalonId, u.MasterId);

    private static AdminUserDto MapAdminDto(AppUser u) => new(
        u.Id, u.Email!, u.FirstName, u.LastName, u.PhoneNumber,
        u.Role.ToString(), u.SalonId, u.MasterId, u.ExternalProvider, u.CreatedAt);

    // ── Private JSON response models ──────────────────────────────────────────

    private sealed class GoogleTokenInfo
    {
        [JsonPropertyName("sub")] public string? Sub { get; set; }
        [JsonPropertyName("email")] public string? Email { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("aud")] public string? Aud { get; set; }
    }

    private sealed class FacebookUserInfo
    {
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("email")] public string? Email { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
    }
}
