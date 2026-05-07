using Bookio.Infrastructure.Entities;
using Bookio.Infrastructure.Persistence;
using Bookio.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Bookio.API.Controllers;

/// <summary>
/// Test data seed endpoints — for integration/automation tests ONLY.
/// Not available in Production.
/// </summary>
[ApiController]
[Route("api/dev")]
public class DevSeedController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly IWebHostEnvironment _env;

    public DevSeedController(AppDbContext db, UserManager<AppUser> userManager, IWebHostEnvironment env)
    {
        _db          = db;
        _userManager = userManager;
        _env         = env;
    }

    /// <summary>
    /// Apply comprehensive test data seed.
    /// Idempotent — safe to call multiple times; skips if data already exists.
    /// </summary>
    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        if (_env.IsProduction())
            return Forbid();

        await TestDataSeeder.ClearAsync(_db, _userManager);
        await TestDataSeeder.SeedAsync(_db, _userManager);
        return Ok(new
        {
            message  = "Test seed applied.",
            accounts = new
            {
                superAdmin     = new { email = "superadmin.seed@bookio.dev",  password = "TestSeed1234!" },
                salonAdminGlow = new { email = "admin.glow.seed@bookio.dev", password = "TestSeed1234!" },
                salonAdminLuxe = new { email = "admin.luxe.seed@bookio.dev", password = "TestSeed1234!" },
                masterAshley   = new { email = "ashley.seed@bookio.dev",     password = "TestSeed1234!" },
                masterJessica  = new { email = "jessica.seed@bookio.dev",    password = "TestSeed1234!" },
                masterLauren   = new { email = "lauren.seed@bookio.dev",     password = "TestSeed1234!" },
                masterSofia    = new { email = "sofia.seed@bookio.dev",      password = "TestSeed1234!" },
                masterNoah     = new { email = "noah.seed@bookio.dev",       password = "TestSeed1234!", note = "IsActive=false — pending activation" },
                client1        = new { email = "alice.seed@bookio.dev",      password = "TestSeed1234!" },
                client2        = new { email = "bob.seed@bookio.dev",        password = "TestSeed1234!" },
            },
            salons = new
            {
                glow = new { id = TestDataSeeder.SlnGlow, name = "Glow Beauty Studio", active = true },
                luxe = new { id = TestDataSeeder.SlnLuxe, name = "Luxe Hair & Nails",  active = true },
                zen  = new { id = TestDataSeeder.SlnZen,  name = "Zen Spa & Wellness", active = false },
            },
        });
    }

    /// <summary>
    /// Remove all test seed data created by POST /api/dev/seed.
    /// Leaves SuperAdmin accounts and any other non-seed data untouched.
    /// </summary>
    [HttpDelete("seed")]
    public async Task<IActionResult> Clear()
    {
        if (_env.IsProduction())
            return Forbid();

        await TestDataSeeder.ClearAsync(_db, _userManager);
        return Ok(new { message = "Test seed cleared." });
    }
}
