using BeautySalonBooking.Infrastructure.Entities;
using BeautySalonBooking.Infrastructure.Persistence;
using BeautySalonBooking.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

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
                superAdmin     = new { email = "superadmin.seed@bookvisit.dev",  password = "TestSeed1234!" },
                salonAdminGlow = new { email = "admin.glow.seed@bookvisit.dev", password = "TestSeed1234!" },
                salonAdminLuxe = new { email = "admin.luxe.seed@bookvisit.dev", password = "TestSeed1234!" },
                masterAshley   = new { email = "ashley.seed@bookvisit.dev",     password = "TestSeed1234!" },
                masterJessica  = new { email = "jessica.seed@bookvisit.dev",    password = "TestSeed1234!" },
                masterLauren   = new { email = "lauren.seed@bookvisit.dev",     password = "TestSeed1234!" },
                masterSofia    = new { email = "sofia.seed@bookvisit.dev",      password = "TestSeed1234!" },
                masterNoah     = new { email = "noah.seed@bookvisit.dev",       password = "TestSeed1234!", note = "IsActive=false — pending activation" },
                client1        = new { email = "alice.seed@bookvisit.dev",      password = "TestSeed1234!" },
                client2        = new { email = "bob.seed@bookvisit.dev",        password = "TestSeed1234!" },
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
