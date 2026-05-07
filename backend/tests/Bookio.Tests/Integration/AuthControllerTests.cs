using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Bookio.Tests.Integration.Setup;
using FluentAssertions;

namespace Bookio.Tests.Integration;

public class AuthControllerTests : IntegrationTestBase
{
    public AuthControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    private static string UniqueEmail() => $"test+{Guid.NewGuid():N}@bookio.com";
    private static string UniquePhone() => $"+1{Random.Shared.NextInt64(1000000000, 9999999999)}";

    // ── Registration ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_WithEmailOnly_Returns200_AndUser()
    {
        var email = UniqueEmail();
        var response = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Test1234!",
            firstName = "Email",
            lastName = "Only"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        body.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        body.GetProperty("user").GetProperty("email").GetString().Should().Be(email);
        body.GetProperty("user").GetProperty("role").GetString().Should().Be("Client");
    }

    [Fact]
    public async Task Register_WithPhoneOnly_Returns200_AndUser()
    {
        var phone = UniquePhone();
        var response = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            password = "Test1234!",
            firstName = "Phone",
            lastName = "Only",
            phone
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        body.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        body.GetProperty("user").GetProperty("phone").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_WithEmailAndPhone_Returns200_AndUser()
    {
        var email = UniqueEmail();
        var phone = UniquePhone();
        var response = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Test1234!",
            firstName = "Both",
            lastName = "Contact",
            phone
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        body.GetProperty("user").GetProperty("email").GetString().Should().Be(email);
        body.GetProperty("user").GetProperty("phone").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_WithoutEmailOrPhone_Returns400()
    {
        var response = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            password = "Test1234!",
            firstName = "No",
            lastName = "Contact"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        body.GetProperty("error").GetString().Should().ContainEquivalentOf("email or phone");
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns400()
    {
        var email = UniqueEmail();
        var first = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Test1234!",
            firstName = "First",
            lastName = "User"
        });
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        var second = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Test1234!",
            firstName = "Second",
            lastName = "User"
        });

        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await second.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        body.GetProperty("error").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_DuplicatePhone_Returns400()
    {
        var phone = UniquePhone();
        var first = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            password = "Test1234!",
            firstName = "First",
            lastName = "User",
            phone
        });
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        var second = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            password = "Test1234!",
            firstName = "Second",
            lastName = "User",
            phone
        });

        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await second.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        body.GetProperty("error").GetString().Should().NotBeNullOrEmpty();
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WithEmail_Returns200()
    {
        var email = UniqueEmail();
        var regResp = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Test1234!",
            firstName = "Login",
            lastName = "Email"
        });
        regResp.StatusCode.Should().Be(HttpStatusCode.OK);

        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = email,
            password = "Test1234!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        body.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        body.GetProperty("user").GetProperty("email").GetString().Should().Be(email);
    }

    [Fact]
    public async Task Login_WithPhone_Returns200()
    {
        var phone = UniquePhone();
        var regResp = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            password = "Test1234!",
            firstName = "Login",
            lastName = "Phone",
            phone
        });
        regResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // Login using the phone number
        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = phone,
            password = "Test1234!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        body.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var email = UniqueEmail();
        await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Test1234!",
            firstName = "Wrong",
            lastName = "Pass"
        });

        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = email,
            password = "WrongPassword1!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_NonexistentIdentifier_Returns401()
    {
        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = "nobody@nowhere.com",
            password = "Test1234!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_NonexistentPhone_Returns401()
    {
        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = "+19999999999",
            password = "Test1234!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Registration returns refresh cookie ───────────────────────────────────

    [Fact]
    public async Task Register_SetsRefreshTokenCookie()
    {
        var email = UniqueEmail();
        var response = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Test1234!",
            firstName = "Cookie",
            lastName = "Test"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.Should().ContainKey("Set-Cookie");
        var cookies = response.Headers.GetValues("Set-Cookie");
        cookies.Should().Contain(c => c.Contains("refreshToken"));
    }

    [Fact]
    public async Task Login_SetsRefreshTokenCookie()
    {
        var email = UniqueEmail();
        await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Test1234!",
            firstName = "Cookie",
            lastName = "Login"
        });

        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = email,
            password = "Test1234!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.Should().ContainKey("Set-Cookie");
        var cookies = response.Headers.GetValues("Set-Cookie");
        cookies.Should().Contain(c => c.Contains("refreshToken"));
    }

    // ── Phone normalization ───────────────────────────────────────────────────

    [Fact]
    public async Task Login_WithFormattedPhone_MatchesNormalized()
    {
        // Register with formatted phone
        var rawPhone = "+1 (555) 123-4567";
        var regResp = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            password = "Test1234!",
            firstName = "Formatted",
            lastName = "Phone",
            phone = rawPhone
        });
        regResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // Login with the same formatted phone
        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = rawPhone,
            password = "Test1234!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Register edge cases ─────────────────────────────────────────────────

    [Fact]
    public async Task Register_WithShortPhone_NoEmail_StillAccepted()
    {
        // Phone "123" passes the IsNullOrWhiteSpace check but normalizes to null
        // (too few digits). The server currently allows this — the user ends up
        // with no email and no phone stored. This tests current behavior.
        var response = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            password = "Test1234!",
            firstName = "Short",
            lastName = "Phone",
            phone = "123"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
