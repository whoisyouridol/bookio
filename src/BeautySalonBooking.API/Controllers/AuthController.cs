using System.Security.Claims;
using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly bool _isProduction;
    private const string RefreshCookieName = "refreshToken";

    public AuthController(AuthService auth, IWebHostEnvironment env)
    {
        _auth = auth;
        _isProduction = env.IsProduction();
    }

    /// <summary>Register a new client account with email and password</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var (result, rawRefresh, error) = await _auth.RegisterAsync(req);
        if (error != null) return BadRequest(new { error });
        SetRefreshCookie(rawRefresh!);
        return Ok(result);
    }

    /// <summary>Login with email and password</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var (result, rawRefresh, error) = await _auth.LoginAsync(req);
        if (error != null) return Unauthorized(new { error });
        SetRefreshCookie(rawRefresh!);
        return Ok(result);
    }

    /// <summary>Authenticate via Google ID token (obtained from @react-oauth/google on the frontend)</summary>
    [HttpPost("google")]
    public async Task<IActionResult> Google([FromBody] GoogleAuthRequest req)
    {
        var (result, rawRefresh, error) = await _auth.LoginWithGoogleAsync(req);
        if (error != null) return BadRequest(new { error });
        SetRefreshCookie(rawRefresh!);
        return Ok(result);
    }

    /// <summary>Authenticate via Facebook access token (obtained from Facebook JS SDK on the frontend)</summary>
    [HttpPost("facebook")]
    public async Task<IActionResult> Facebook([FromBody] FacebookAuthRequest req)
    {
        var (result, rawRefresh, error) = await _auth.LoginWithFacebookAsync(req);
        if (error != null) return BadRequest(new { error });
        SetRefreshCookie(rawRefresh!);
        return Ok(result);
    }

    /// <summary>Register a new master account with email and password. Returns a pending-activation message — no tokens issued.</summary>
    [HttpPost("master/register")]
    public async Task<IActionResult> MasterRegister([FromBody] MasterRegisterRequest req)
    {
        var (message, error) = await _auth.RegisterMasterAsync(req);
        if (error != null) return BadRequest(new { error });
        return Ok(new { message });
    }

    /// <summary>Register a new master account via Google. Returns a pending-activation message — no tokens issued.</summary>
    [HttpPost("master/google")]
    public async Task<IActionResult> MasterGoogle([FromBody] MasterGoogleAuthRequest req)
    {
        var (message, error) = await _auth.RegisterMasterWithGoogleAsync(req);
        if (error != null) return BadRequest(new { error });
        return Ok(new { message });
    }

    /// <summary>Register a new master account via Facebook. Returns a pending-activation message — no tokens issued.</summary>
    [HttpPost("master/facebook")]
    public async Task<IActionResult> MasterFacebook([FromBody] MasterFacebookAuthRequest req)
    {
        var (message, error) = await _auth.RegisterMasterWithFacebookAsync(req);
        if (error != null) return BadRequest(new { error });
        return Ok(new { message });
    }

    /// <summary>Exchange the HttpOnly refresh-token cookie for a new access token (token rotation)</summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var cookieToken = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrEmpty(cookieToken))
            return Unauthorized(new { error = "No refresh token" });

        var (result, rawRefresh, error) = await _auth.RefreshAsync(cookieToken);
        if (error != null) return Unauthorized(new { error });
        SetRefreshCookie(rawRefresh!);
        return Ok(result);
    }

    /// <summary>Revoke the current refresh token and clear the cookie</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var cookieToken = Request.Cookies[RefreshCookieName];
        if (!string.IsNullOrEmpty(cookieToken))
            await _auth.LogoutAsync(cookieToken);

        Response.Cookies.Delete(RefreshCookieName, new CookieOptions { Path = "/api/auth/refresh" });
        return NoContent();
    }

    /// <summary>Get current authenticated user details</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var user = await _auth.GetMeAsync(userId.Value);
        return user == null ? NotFound() : Ok(user);
    }

    /// <summary>Change password (requires existing password; not available for social login accounts)</summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var (ok, error) = await _auth.ChangePasswordAsync(userId.Value, req);
        if (!ok) return BadRequest(new { error });
        return NoContent();
    }

    /// <summary>Request a password-reset email (always returns 200 to prevent email enumeration)</summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        await _auth.ForgotPasswordAsync(req);
        return Ok(new { message = "If that email exists, a reset link has been sent." });
    }

    /// <summary>Reset password using the token received by email</summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var (ok, error) = await _auth.ResetPasswordAsync(req);
        if (!ok) return BadRequest(new { error });
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void SetRefreshCookie(string rawRefreshToken)
    {
        Response.Cookies.Append(RefreshCookieName, rawRefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = _isProduction,
            SameSite = SameSiteMode.Lax,
            Path = "/api/auth/refresh",
            Expires = DateTimeOffset.UtcNow.AddDays(7),
        });
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
