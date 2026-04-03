namespace BeautySalonBooking.Application.DTOs;

public record RegisterRequest(
    string? Email,
    string Password,
    string? FirstName,
    string? LastName,
    string? Phone,
    /// <summary>"Client" | "SalonAdmin" | "MasterAdmin". Defaults to Client.</summary>
    string? Role = null);

public record LoginRequest(string Identifier, string Password);

public record GoogleAuthRequest(string? Credential = null, string? AccessToken = null);

public record FacebookAuthRequest(string AccessToken);

// ── Master registration ────────────────────────────────────────────────────

/// <summary>Register a new master via email + password. Account is inactive until SuperAdmin activates it.</summary>
public record MasterRegisterRequest(
    string? Email,
    string Password,
    string FirstName,
    string LastName,
    string? Phone,
    Guid SalonId);

/// <summary>Register a new master via Google. Account is inactive until SuperAdmin activates it.</summary>
public record MasterGoogleAuthRequest(string? Credential = null, string? AccessToken = null, Guid SalonId = default);

/// <summary>Register a new master via Facebook. Account is inactive until SuperAdmin activates it.</summary>
public record MasterFacebookAuthRequest(string AccessToken, Guid SalonId);

// ── Salon admin registration ──────────────────────────────────────────────

/// <summary>Register a new salon admin via email + password. Account is inactive until SuperAdmin activates it.</summary>
public record SalonAdminRegisterRequest(
    string? Email,
    string Password,
    string FirstName,
    string LastName,
    string? Phone,
    Guid SalonId);

/// <summary>Register a new salon admin with a brand-new salon. Both salon and user are inactive until SuperAdmin activates.</summary>
public record SalonAdminRegisterWithNewSalonRequest(
    string? Email,
    string Password,
    string FirstName,
    string LastName,
    string? Phone,
    // Salon fields
    string SalonName,
    string SalonAddress,
    string WorkingHoursStart,
    string WorkingHoursEnd,
    List<string> WorkingDays);

/// <summary>Register a new salon admin via Google. Account is inactive until SuperAdmin activates it.</summary>
public record SalonAdminGoogleAuthRequest(string? Credential = null, string? AccessToken = null, Guid SalonId = default);

/// <summary>Register a new salon admin via Facebook. Account is inactive until SuperAdmin activates it.</summary>
public record SalonAdminFacebookAuthRequest(string AccessToken, Guid SalonId);

public record RefreshRequest(); // body empty — token comes from HttpOnly cookie

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record ForgotPasswordRequest(string Identifier);

public record ResetPasswordRequest(string Email, string Token, string NewPassword);

// ── Admin user management ──────────────────────────────────────────────────

public record CreateAdminUserRequest(
    string? Email,
    /// <summary>When null, a temporary password is auto-generated and MustChangePassword is set.</summary>
    string? Password,
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

public record UpdateUserProfileRequest(
    string? FirstName,
    string? LastName,
    string? Phone,
    string? Email);

public record SetUserActiveRequest(bool IsActive);

// ── Responses ─────────────────────────────────────────────────────────────

public record AuthResponse(string AccessToken, UserDto User);

public record UserDto(
    Guid Id,
    string? Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string Role,
    Guid? SalonId,
    Guid? MasterId,
    bool MustChangePassword = false);

public record AdminUserDto(
    Guid Id,
    string? Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string Role,
    Guid? SalonId,
    Guid? MasterId,
    string? ExternalProvider,
    bool IsActive,
    DateTime CreatedAt);
