namespace BeautySalonBooking.Application.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string? Phone,
    /// <summary>"Client" | "SalonAdmin" | "MasterAdmin". Defaults to Client.</summary>
    string? Role = null);

public record LoginRequest(string Email, string Password);

public record GoogleAuthRequest(string Credential);

public record FacebookAuthRequest(string AccessToken);

public record RefreshRequest(); // body empty — token comes from HttpOnly cookie

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Email, string Token, string NewPassword);

// ── Admin user management ──────────────────────────────────────────────────

public record CreateAdminUserRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string? Phone,
    /// <summary>"SalonAdmin" | "MasterAdmin" | "Client"</summary>
    string Role,
    Guid? SalonId,
    Guid? MasterId);

public record UpdateUserRoleRequest(
    /// <summary>"SalonAdmin" | "MasterAdmin" | "Client"</summary>
    string Role,
    Guid? SalonId,
    Guid? MasterId);

// ── Responses ─────────────────────────────────────────────────────────────

public record AuthResponse(string AccessToken, UserDto User);

public record UserDto(
    Guid Id,
    string Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string Role,
    Guid? SalonId,
    Guid? MasterId);

public record AdminUserDto(
    Guid Id,
    string Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string Role,
    Guid? SalonId,
    Guid? MasterId,
    string? ExternalProvider,
    DateTime CreatedAt);
