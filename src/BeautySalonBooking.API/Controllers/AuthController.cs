using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly bool _isProduction;
    private const string RefreshCookieName = "refreshToken";

    private readonly string[] _mainDomains;
    private readonly IMemoryCache _cache;
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    public AuthController(AuthService auth, IWebHostEnvironment env, IConfiguration config,
        IMemoryCache cache, IHttpClientFactory http)
    {
        _auth = auth;
        _isProduction = env.IsProduction();
        _mainDomains = config.GetSection("Subdomain:MainDomains").Get<string[]>()
            ?? ["localhost"];
        _cache = cache;
        _http = http;
        _config = config;
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

    // ── Google OAuth Code Flow (for subdomain login) ──────────────────────────

    /// <summary>Start Google OAuth code flow. Redirects browser to Google account picker.</summary>
    [HttpGet("google/start")]
    public IActionResult GoogleStart([FromQuery] string? returnTo)
    {
        var clientId = _config["OAuth:Google:ClientId"];
        var callbackUrl = _config["OAuth:Google:CallbackUrl"];
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(callbackUrl))
            return BadRequest(new { error = "Google OAuth is not configured" });

        // Validate returnTo is a trusted subdomain to prevent open redirect
        var safeReturnTo = SanitizeReturnTo(returnTo);

        var state = Guid.NewGuid().ToString("N");
        _cache.Set($"google_state:{state}", safeReturnTo, TimeSpan.FromMinutes(10));

        var query = new Dictionary<string, string>
        {
            ["client_id"]     = clientId,
            ["redirect_uri"]  = callbackUrl,
            ["response_type"] = "code",
            ["scope"]         = "openid email profile",
            ["state"]         = state,
            ["prompt"]        = "select_account",
        };
        var url = "https://accounts.google.com/o/oauth2/v2/auth?" +
                  string.Join("&", query.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

        return Redirect(url);
    }

    /// <summary>Google OAuth callback — exchanges code for tokens, sets session cookie, redirects back.</summary>
    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
            return RedirectWithError("google_cancelled");

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
            return RedirectWithError("invalid_request");

        if (!_cache.TryGetValue($"google_state:{state}", out string? returnTo))
            return RedirectWithError("state_mismatch");
        _cache.Remove($"google_state:{state}");

        var clientId     = _config["OAuth:Google:ClientId"]!;
        var clientSecret = _config["OAuth:Google:ClientSecret"]!;
        var callbackUrl  = _config["OAuth:Google:CallbackUrl"]!;

        // Exchange authorization code for tokens
        var http = _http.CreateClient();
        var tokenResp = await http.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"]          = code,
                ["client_id"]     = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"]  = callbackUrl,
                ["grant_type"]    = "authorization_code",
            }));

        if (!tokenResp.IsSuccessStatusCode)
            return Redirect($"{returnTo}?auth_error=google_token_exchange_failed");

        var tokenJson = await tokenResp.Content.ReadFromJsonAsync<GoogleTokenResponse>();
        if (string.IsNullOrEmpty(tokenJson?.IdToken))
            return Redirect($"{returnTo}?auth_error=missing_id_token");

        // Reuse existing auth service — validates id_token and finds/creates user
        var (result, rawRefresh, authError) = await _auth.LoginWithGoogleAsync(new GoogleAuthRequest(tokenJson.IdToken));
        if (authError != null)
            return Redirect($"{returnTo}?auth_error={Uri.EscapeDataString(authError)}");

        SetRefreshCookie(rawRefresh!);
        return Redirect(returnTo!);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void SetRefreshCookie(string rawRefreshToken)
    {
        var opts = new CookieOptions
        {
            HttpOnly = true,
            Secure = _isProduction,
            SameSite = SameSiteMode.Lax,
            Path = "/api/auth/refresh",
            Expires = DateTimeOffset.UtcNow.AddDays(7),
        };

        // Derive cookie domain from request host so it works across subdomains
        // e.g. request from glow.bookvisit.com → cookie domain = .bookvisit.com
        var requestHost = Request.Host.Host;
        foreach (var domain in _mainDomains)
        {
            if (requestHost.Equals(domain, StringComparison.OrdinalIgnoreCase)
                || requestHost.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase))
            {
                opts.Domain = "." + domain;
                break;
            }
        }

        Response.Cookies.Append(RefreshCookieName, rawRefreshToken, opts);
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private string SanitizeReturnTo(string? returnTo)
    {
        if (string.IsNullOrWhiteSpace(returnTo)) return "/";
        try
        {
            var uri = new Uri(returnTo);
            var host = uri.Host.ToLowerInvariant();
            foreach (var domain in _mainDomains)
            {
                if (host.Equals(domain, StringComparison.OrdinalIgnoreCase) ||
                    host.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase))
                    return returnTo;
            }
        }
        catch { }
        return "/";
    }

    private IActionResult RedirectWithError(string errorCode)
    {
        // Redirect to main domain login with error — we don't know returnTo at this point
        return Redirect($"/?auth_error={errorCode}");
    }

    private sealed class GoogleTokenResponse
    {
        [JsonPropertyName("id_token")]    public string? IdToken { get; set; }
        [JsonPropertyName("access_token")] public string? AccessToken { get; set; }
    }
}
