using Bookio.Domain.Entities;
using Bookio.Domain.Enums;
using Bookio.Infrastructure.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Bookio.Infrastructure.Persistence.Seed;

/// <summary>
/// Deterministic, comprehensive test data seed for integration and automation tests.
/// All entity IDs are fixed GUIDs — safe to clean up precisely via ClearAsync.
///
/// Apply : POST /api/dev/seed
/// Clear : DELETE /api/dev/seed
/// </summary>
public static class TestDataSeeder
{
    // ── Services ──────────────────────────────────────────────────────────────
    public static readonly Guid SvcHaircut  = Guid.Parse("aaaa0001-0000-0000-0000-000000000000");
    public static readonly Guid SvcColoring = Guid.Parse("aaaa0002-0000-0000-0000-000000000000");
    public static readonly Guid SvcManicure = Guid.Parse("aaaa0003-0000-0000-0000-000000000000");
    public static readonly Guid SvcPedicure = Guid.Parse("aaaa0004-0000-0000-0000-000000000000");
    public static readonly Guid SvcEyebrows = Guid.Parse("aaaa0005-0000-0000-0000-000000000000");
    public static readonly Guid SvcMassage  = Guid.Parse("aaaa0006-0000-0000-0000-000000000000");
    public static readonly Guid SvcFacial   = Guid.Parse("aaaa0007-0000-0000-0000-000000000000");

    // ── Masters ───────────────────────────────────────────────────────────────
    public static readonly Guid MstAshley  = Guid.Parse("bbbb0001-0000-0000-0000-000000000000"); // active, auto-approve, 2 salons
    public static readonly Guid MstJessica = Guid.Parse("bbbb0002-0000-0000-0000-000000000000"); // active, auto-approve, 1 salon
    public static readonly Guid MstLauren = Guid.Parse("bbbb0003-0000-0000-0000-000000000000"); // active, manual-approve, 2 salons
    public static readonly Guid MstSofia   = Guid.Parse("bbbb0004-0000-0000-0000-000000000000"); // active, only in inactive salon
    public static readonly Guid MstNoah    = Guid.Parse("bbbb0005-0000-0000-0000-000000000000"); // soft-deleted (IsDeleted=true)

    // ── Master AppUser accounts ───────────────────────────────────────────────
    public static readonly Guid UsrAshley  = Guid.Parse("cccc0001-0000-0000-0000-000000000000");
    public static readonly Guid UsrJessica = Guid.Parse("cccc0002-0000-0000-0000-000000000000");
    public static readonly Guid UsrLauren  = Guid.Parse("cccc0003-0000-0000-0000-000000000000");
    public static readonly Guid UsrSofia   = Guid.Parse("cccc0004-0000-0000-0000-000000000000");
    public static readonly Guid UsrNoah    = Guid.Parse("cccc0005-0000-0000-0000-000000000000"); // IsActive=false (pending activation)

    // ── Salons ────────────────────────────────────────────────────────────────
    public static readonly Guid SlnGlow = Guid.Parse("dddd0001-0000-0000-0000-000000000000"); // active, Mon-Sat
    public static readonly Guid SlnLuxe = Guid.Parse("dddd0002-0000-0000-0000-000000000000"); // active, Mon-Fri
    public static readonly Guid SlnZen  = Guid.Parse("dddd0003-0000-0000-0000-000000000000"); // inactive (IsActive=false)

    // ── SalonMasters ──────────────────────────────────────────────────────────
    public static readonly Guid SmGlowAshley  = Guid.Parse("eeee0001-0000-0000-0000-000000000000"); // split shift
    public static readonly Guid SmGlowJessica = Guid.Parse("eeee0002-0000-0000-0000-000000000000");
    public static readonly Guid SmGlowLauren  = Guid.Parse("eeee0003-0000-0000-0000-000000000000"); // manual-approve
    public static readonly Guid SmLuxeAshley  = Guid.Parse("eeee0004-0000-0000-0000-000000000000"); // Sat only, cross-salon
    public static readonly Guid SmLuxeLauren  = Guid.Parse("eeee0005-0000-0000-0000-000000000000"); // Mon-Fri, cross-salon
    public static readonly Guid SmZenSofia    = Guid.Parse("eeee0006-0000-0000-0000-000000000000"); // inactive salon

    // ── MasterServices (fixed GUIDs — referenced by BookingServices) ──────────
    public static readonly Guid MsAshleyHaircut   = Guid.Parse("ff000001-0000-0000-0000-000000000000");
    public static readonly Guid MsAshleyColoring  = Guid.Parse("ff000002-0000-0000-0000-000000000000");
    public static readonly Guid MsJessicaManicure = Guid.Parse("ff000003-0000-0000-0000-000000000000");
    public static readonly Guid MsJessicaPedicure = Guid.Parse("ff000004-0000-0000-0000-000000000000");
    public static readonly Guid MsJessicaEyebrows = Guid.Parse("ff000005-0000-0000-0000-000000000000");
    public static readonly Guid MsLaurenHaircut   = Guid.Parse("ff000006-0000-0000-0000-000000000000");
    public static readonly Guid MsLaurenEyebrows  = Guid.Parse("ff000007-0000-0000-0000-000000000000");
    public static readonly Guid MsLaurenMassage   = Guid.Parse("ff000008-0000-0000-0000-000000000000");
    public static readonly Guid MsSofiaMassage    = Guid.Parse("ff000009-0000-0000-0000-000000000000");
    public static readonly Guid MsSofiaFacial     = Guid.Parse("ff000010-0000-0000-0000-000000000000");
    public static readonly Guid MsNoahHaircut     = Guid.Parse("ff000011-0000-0000-0000-000000000000"); // inactive

    // ── Admin / Client user accounts ──────────────────────────────────────────
    public static readonly Guid UsrSuperAdmin     = Guid.Parse("9999b001-0000-0000-0000-000000000000");
    public static readonly Guid UsrSalonAdminGlow = Guid.Parse("9999a001-0000-0000-0000-000000000000");
    public static readonly Guid UsrSalonAdminLuxe = Guid.Parse("9999a002-0000-0000-0000-000000000000");
    public static readonly Guid UsrClient1        = Guid.Parse("9999c001-0000-0000-0000-000000000000"); // Alice Johnson
    public static readonly Guid UsrClient2        = Guid.Parse("9999c002-0000-0000-0000-000000000000"); // Bob Smith

    // ── Bookings ──────────────────────────────────────────────────────────────
    public static readonly Guid BkgCompletedRated     = Guid.Parse("b0000001-0000-0000-0000-000000000000"); // past, completed, rated
    public static readonly Guid BkgCompletedUnrated   = Guid.Parse("b0000002-0000-0000-0000-000000000000"); // past, completed, no rating
    public static readonly Guid BkgCompletedMultiSvc  = Guid.Parse("b0000003-0000-0000-0000-000000000000"); // past, completed, 2 services, rated
    public static readonly Guid BkgCompletedAnonymous = Guid.Parse("b0000004-0000-0000-0000-000000000000"); // past, completed, no UserId
    public static readonly Guid BkgCancelledByClient  = Guid.Parse("b0000005-0000-0000-0000-000000000000"); // past, cancelled by client
    public static readonly Guid BkgCancelledByMaster  = Guid.Parse("b0000006-0000-0000-0000-000000000000"); // past, cancelled by master
    public static readonly Guid BkgFutureConfirmed1   = Guid.Parse("b0000007-0000-0000-0000-000000000000"); // future, confirmed, client 1
    public static readonly Guid BkgFutureConfirmed2   = Guid.Parse("b0000008-0000-0000-0000-000000000000"); // future, confirmed, 2 services, client 2
    public static readonly Guid BkgFutureAnonymous    = Guid.Parse("b0000009-0000-0000-0000-000000000000"); // future, confirmed, no UserId
    public static readonly Guid BkgFuturePending      = Guid.Parse("b000000a-0000-0000-0000-000000000000"); // future, pending (edge-case state)
    public static readonly Guid BkgLuxeConfirmed      = Guid.Parse("b000000b-0000-0000-0000-000000000000"); // future, Luxe salon, cross-salon master

    // ── Ratings ───────────────────────────────────────────────────────────────
    public static readonly Guid RtgAshleyLinked    = Guid.Parse("aa000001-0000-0000-0000-000000000000"); // linked to BkgCompletedRated
    public static readonly Guid RtgLaurenLinked    = Guid.Parse("aa000002-0000-0000-0000-000000000000"); // linked to BkgCompletedMultiSvc
    public static readonly Guid RtgAshleyStdalone1 = Guid.Parse("aa000003-0000-0000-0000-000000000000"); // standalone
    public static readonly Guid RtgAshleyStdalone2 = Guid.Parse("aa000004-0000-0000-0000-000000000000"); // standalone
    public static readonly Guid RtgJessicaStdalone = Guid.Parse("aa000005-0000-0000-0000-000000000000"); // standalone
    public static readonly Guid RtgLaurenStdalone  = Guid.Parse("aa000006-0000-0000-0000-000000000000"); // standalone

    // ── Date overrides ────────────────────────────────────────────────────────
    public static readonly Guid OvrAshleyDayOff   = Guid.Parse("bb000001-0000-0000-0000-000000000000"); // Ashley@Glow full day off
    public static readonly Guid OvrLaurenShortDay = Guid.Parse("bb000002-0000-0000-0000-000000000000"); // Lauren@Glow custom hours

    // ── Time offs ─────────────────────────────────────────────────────────────
    public static readonly Guid ToffSofiaVacation = Guid.Parse("cc000001-0000-0000-0000-000000000000"); // Sofia@Zen vacation

    // ─────────────────────────────────────────────────────────────────────────

    public static async Task SeedAsync(AppDbContext db, UserManager<AppUser> userManager)
    {
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now.Date);

        // Relative past/future dates
        var past21Mon = GetPrevWeekday(today.AddDays(-14), DayOfWeek.Monday);
        var past14Mon = GetPrevWeekday(today.AddDays(-7),  DayOfWeek.Monday);
        var past7Wed  = GetPrevWeekday(today,              DayOfWeek.Wednesday);
        var past7Fri  = GetPrevWeekday(today,              DayOfWeek.Friday);
        var past7Mon  = GetPrevWeekday(today,              DayOfWeek.Monday);

        var futTue  = GetNextWeekday(today.AddDays(7), DayOfWeek.Tuesday);
        var futWed  = GetNextWeekday(today.AddDays(7), DayOfWeek.Wednesday);
        var futThu  = GetNextWeekday(today.AddDays(7), DayOfWeek.Thursday);
        var futSat  = GetNextWeekday(today.AddDays(7), DayOfWeek.Saturday);
        var futMon2 = GetNextWeekday(today.AddDays(14), DayOfWeek.Monday); // 2 weeks out
        var futMon1 = GetNextWeekday(today.AddDays(7),  DayOfWeek.Monday); // used for Ashley day-off override
        var nextFri = GetNextWeekday(today.AddDays(1),  DayOfWeek.Friday); // Lauren short-day override

        var monFri = new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
        var monSat = new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday };
        var satOnly = new List<DayOfWeek> { DayOfWeek.Saturday };

        // ── Services ──────────────────────────────────────────────────────────
        await db.Services.AddRangeAsync(new[]
        {
            new Domain.Entities.Service { Id = SvcHaircut,  Name = "Haircut & Styling",  Description = "Professional haircut with blow-dry and styling",        CreatedAt = now, UpdatedAt = now },
            new Domain.Entities.Service { Id = SvcColoring, Name = "Hair Coloring",      Description = "Full or partial coloring, highlights, balayage",        CreatedAt = now, UpdatedAt = now },
            new Domain.Entities.Service { Id = SvcManicure, Name = "Manicure",           Description = "Classic or gel manicure with nail art options",          CreatedAt = now, UpdatedAt = now },
            new Domain.Entities.Service { Id = SvcPedicure, Name = "Pedicure",           Description = "Relaxing pedicure with scrub and polish",               CreatedAt = now, UpdatedAt = now },
            new Domain.Entities.Service { Id = SvcEyebrows, Name = "Eyebrow Shaping",    Description = "Precision threading, waxing or microblading",            CreatedAt = now, UpdatedAt = now },
            new Domain.Entities.Service { Id = SvcMassage,  Name = "Relaxation Massage", Description = "60-min full-body relaxation massage with aromatherapy",  CreatedAt = now, UpdatedAt = now },
            new Domain.Entities.Service { Id = SvcFacial,   Name = "Hydrating Facial",   Description = "Deep-cleanse and hydrating facial treatment",            CreatedAt = now, UpdatedAt = now },
        });

        // ── Salons ────────────────────────────────────────────────────────────
        await db.Salons.AddRangeAsync(new[]
        {
            new Salon
            {
                Id = SlnGlow, Name = "Glow Beauty Studio", Slug = "glow", IsActive = true,
                Address = "742 Market St, San Francisco, CA 94102",
                WorkingHoursStart = new TimeOnly(9, 0), WorkingHoursEnd = new TimeOnly(21, 0),
                WorkingDays = monSat, CreatedAt = now, UpdatedAt = now,
            },
            new Salon
            {
                Id = SlnLuxe, Name = "Luxe Hair & Nails", Slug = "luxe", IsActive = true,
                Address = "1280 Lexington Ave, New York, NY 10028",
                WorkingHoursStart = new TimeOnly(10, 0), WorkingHoursEnd = new TimeOnly(20, 0),
                WorkingDays = monFri, CreatedAt = now, UpdatedAt = now,
            },
            new Salon
            {
                // Edge case: inactive salon — masters/bookings still exist but salon is closed
                Id = SlnZen, Name = "Zen Spa & Wellness", Slug = "zen", IsActive = false,
                Address = "500 Pine St, Seattle, WA 98101",
                WorkingHoursStart = new TimeOnly(10, 0), WorkingHoursEnd = new TimeOnly(18, 0),
                WorkingDays = monFri, CreatedAt = now, UpdatedAt = now,
            },
        });

        // ── Masters ───────────────────────────────────────────────────────────
        await db.Masters.AddRangeAsync(new[]
        {
            new Master { Id = MstAshley,  UserId = UsrAshley,  AutoApproveBookings = true,  IsDeleted = false, Description = "Hair specialist, 8 years experience. Balayage and color transformations.", CreatedAt = now, UpdatedAt = now },
            new Master { Id = MstJessica, UserId = UsrJessica, AutoApproveBookings = true,  IsDeleted = false, Description = "Certified nail technician and beauty artist, 6 years in the industry.",    CreatedAt = now, UpdatedAt = now },
            new Master { Id = MstLauren,  UserId = UsrLauren,  AutoApproveBookings = false, IsDeleted = false, Description = "Versatile beauty professional. Reviews each booking before confirming.",   CreatedAt = now, UpdatedAt = now },
            new Master { Id = MstSofia,   UserId = UsrSofia,   AutoApproveBookings = true,  IsDeleted = false, Description = "Spa and wellness specialist. Currently on extended leave.",                CreatedAt = now, UpdatedAt = now },
            // Edge case: soft-deleted master — still has historical records but no new bookings
            new Master { Id = MstNoah,    UserId = UsrNoah,    AutoApproveBookings = true,  IsDeleted = true,  Description = "Former stylist — profile deactivated.", CreatedAt = now, UpdatedAt = now },
        });

        // ── Master user accounts ──────────────────────────────────────────────
        const string pwd = "TestSeed1234!";
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrAshley, UserName = $"user_{UsrAshley}", Email = "ashley.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Ashley", LastName = "Morgan", PhoneNumber = "+14155550101",
            Role = AppRole.Master, MasterId = MstAshley, SalonId = SlnGlow, IsActive = true,
        }, pwd);
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrJessica, UserName = $"user_{UsrJessica}", Email = "jessica.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Jessica", LastName = "Williams", PhoneNumber = "+14155550102",
            Role = AppRole.Master, MasterId = MstJessica, IsActive = true,
        }, pwd);
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrLauren, UserName = $"user_{UsrLauren}", Email = "lauren.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Lauren", LastName = "Davis", PhoneNumber = "+14155550103",
            Role = AppRole.Master, MasterId = MstLauren, IsActive = true,
        }, pwd);
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrSofia, UserName = $"user_{UsrSofia}", Email = "sofia.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Sofia", LastName = "Chen", PhoneNumber = "+14155550104",
            Role = AppRole.Master, MasterId = MstSofia, IsActive = true,
        }, pwd);
        await CreateUserAsync(userManager, new AppUser
        {
            // Edge case: IsActive=false — pending admin activation
            Id = UsrNoah, UserName = $"user_{UsrNoah}", Email = "noah.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Noah", LastName = "Taylor", PhoneNumber = "+14155550105",
            Role = AppRole.Master, MasterId = MstNoah, IsActive = false,
        }, pwd);

        // ── Admin + client user accounts ──────────────────────────────────────
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrSuperAdmin, UserName = $"user_{UsrSuperAdmin}", Email = "superadmin.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Super", LastName = "Admin",
            Role = AppRole.SuperAdmin, IsActive = true,
        }, pwd);
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrSalonAdminGlow, UserName = $"user_{UsrSalonAdminGlow}", Email = "admin.glow.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Glow", LastName = "Admin",
            Role = AppRole.SalonAdmin, SalonId = SlnGlow, IsActive = true,
        }, pwd);
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrSalonAdminLuxe, UserName = $"user_{UsrSalonAdminLuxe}", Email = "admin.luxe.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Luxe", LastName = "Admin",
            Role = AppRole.SalonAdmin, SalonId = SlnLuxe, IsActive = true,
        }, pwd);
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrClient1, UserName = $"user_{UsrClient1}", Email = "alice.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Alice", LastName = "Johnson", PhoneNumber = "+14155550301",
            Role = AppRole.Client, IsActive = true,
        }, pwd);
        await CreateUserAsync(userManager, new AppUser
        {
            Id = UsrClient2, UserName = $"user_{UsrClient2}", Email = "bob.seed@bookio.dev",
            EmailConfirmed = true, FirstName = "Bob", LastName = "Smith", PhoneNumber = "+14155550302",
            Role = AppRole.Client, IsActive = true,
        }, pwd);

        // ── SalonMasters ──────────────────────────────────────────────────────
        var salonMasters = new[]
        {
            // Ashley @ Glow (split shift via weekly slots — see below)
            new SalonMaster { Id = SmGlowAshley,  SalonId = SlnGlow, MasterId = MstAshley,  IsActive = true },
            // Jessica @ Glow
            new SalonMaster { Id = SmGlowJessica, SalonId = SlnGlow, MasterId = MstJessica, IsActive = true },
            // Lauren @ Glow, manual approve
            new SalonMaster { Id = SmGlowLauren,  SalonId = SlnGlow, MasterId = MstLauren,  IsActive = true },
            // Ashley @ Luxe (cross-salon edge case)
            new SalonMaster { Id = SmLuxeAshley,  SalonId = SlnLuxe, MasterId = MstAshley,  IsActive = true },
            // Lauren @ Luxe (cross-salon edge case)
            new SalonMaster { Id = SmLuxeLauren,  SalonId = SlnLuxe, MasterId = MstLauren,  IsActive = true },
            // Sofia @ Zen (inactive salon)
            new SalonMaster { Id = SmZenSofia,    SalonId = SlnZen,  MasterId = MstSofia,   IsActive = true },
        };
        await db.SalonMasters.AddRangeAsync(salonMasters);

        // ── MasterServices ────────────────────────────────────────────────────
        await db.MasterServices.AddRangeAsync(new[]
        {
            // Ashley: haircut + coloring
            new MasterService { Id = MsAshleyHaircut,   MasterId = MstAshley,  ServiceId = SvcHaircut,  Price = 85,  DurationMinutes = 60,  IsActive = true },
            new MasterService { Id = MsAshleyColoring,  MasterId = MstAshley,  ServiceId = SvcColoring, Price = 220, DurationMinutes = 120, IsActive = true },
            // Jessica: manicure + pedicure + eyebrows
            new MasterService { Id = MsJessicaManicure, MasterId = MstJessica, ServiceId = SvcManicure, Price = 55,  DurationMinutes = 60,  IsActive = true },
            new MasterService { Id = MsJessicaPedicure, MasterId = MstJessica, ServiceId = SvcPedicure, Price = 75,  DurationMinutes = 90,  IsActive = true },
            new MasterService { Id = MsJessicaEyebrows, MasterId = MstJessica, ServiceId = SvcEyebrows, Price = 35,  DurationMinutes = 30,  IsActive = true },
            // Lauren: haircut + eyebrows + massage
            new MasterService { Id = MsLaurenHaircut,   MasterId = MstLauren,  ServiceId = SvcHaircut,  Price = 95,  DurationMinutes = 60,  IsActive = true },
            new MasterService { Id = MsLaurenEyebrows,  MasterId = MstLauren,  ServiceId = SvcEyebrows, Price = 40,  DurationMinutes = 30,  IsActive = true },
            new MasterService { Id = MsLaurenMassage,   MasterId = MstLauren,  ServiceId = SvcMassage,  Price = 120, DurationMinutes = 90,  IsActive = true },
            // Sofia: massage + facial (at inactive salon — edge case)
            new MasterService { Id = MsSofiaMassage,    MasterId = MstSofia,   ServiceId = SvcMassage,  Price = 110, DurationMinutes = 60,  IsActive = true },
            new MasterService { Id = MsSofiaFacial,     MasterId = MstSofia,   ServiceId = SvcFacial,   Price = 90,  DurationMinutes = 75,  IsActive = true },
            // Noah (deleted master): inactive service edge case
            new MasterService { Id = MsNoahHaircut,     MasterId = MstNoah,    ServiceId = SvcHaircut,  Price = 70,  DurationMinutes = 45,  IsActive = false },
        });

        // ── MasterWeeklySlots — split shift for Ashley @ Glow ─────────────────
        var weeklySlots = new List<MasterWeeklySlot>();
        // Ashley@Glow: Mon-Fri morning 9-13 + afternoon 14-18 (lunch break 13-14)
        foreach (var day in monFri)
        {
            weeklySlots.Add(new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = SmGlowAshley, DayOfWeek = day, StartTime = new TimeOnly(9, 0),  EndTime = new TimeOnly(13, 0) });
            weeklySlots.Add(new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = SmGlowAshley, DayOfWeek = day, StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(18, 0) });
        }
        // Jessica@Glow: Mon-Sat full shift 10-19
        foreach (var day in monSat)
            weeklySlots.Add(new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = SmGlowJessica, DayOfWeek = day, StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(19, 0) });
        // Lauren@Glow: Mon-Sat full shift 11-20
        foreach (var day in monSat)
            weeklySlots.Add(new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = SmGlowLauren, DayOfWeek = day, StartTime = new TimeOnly(11, 0), EndTime = new TimeOnly(20, 0) });
        // Ashley@Luxe: Saturday only 14-20 (cross-salon edge case)
        weeklySlots.Add(new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = SmLuxeAshley, DayOfWeek = DayOfWeek.Saturday, StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(20, 0) });
        // Lauren@Luxe: Mon-Fri 10-18 (cross-salon edge case)
        foreach (var day in monFri)
            weeklySlots.Add(new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = SmLuxeLauren, DayOfWeek = day, StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(18, 0) });
        // Sofia@Zen: Mon-Fri 10-17 (inactive salon)
        foreach (var day in monFri)
            weeklySlots.Add(new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = SmZenSofia, DayOfWeek = day, StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(17, 0) });
        await db.MasterWeeklySlots.AddRangeAsync(weeklySlots);

        // ── MasterDateOverrides ───────────────────────────────────────────────
        // Ashley@Glow: full day off next Monday (overrides regular Mon-Fri schedule)
        await db.MasterDateOverrides.AddAsync(new MasterDateOverride
        {
            Id = OvrAshleyDayOff,
            SalonMasterId = SmGlowAshley,
            Date = futMon1,
            IsDayOff = true,
        });
        // Lauren@Glow: custom short day next Friday (11-15 instead of 11-20)
        await db.MasterDateOverrides.AddAsync(new MasterDateOverride
        {
            Id = OvrLaurenShortDay,
            SalonMasterId = SmGlowLauren,
            Date = nextFri,
            IsDayOff = false,
            Slots = new List<MasterDateOverrideSlot>
            {
                new() { Id = Guid.NewGuid(), StartTime = new TimeOnly(11, 0), EndTime = new TimeOnly(15, 0) },
            },
        });

        // ── MasterTimeOff ─────────────────────────────────────────────────────
        // Sofia@Zen: vacation from day+14 to day+28 (overlaps with slot generation window)
        await db.MasterTimeOffs.AddAsync(new MasterTimeOff
        {
            Id = ToffSofiaVacation,
            SalonMasterId = SmZenSofia,
            StartDate = today.AddDays(14),
            EndDate   = today.AddDays(28),
            Reason    = "Annual vacation",
        });

        // ── Bookings ──────────────────────────────────────────────────────────
        await db.Bookings.AddRangeAsync(new[]
        {
            // 1. Past | Completed | Rated | Single service | Client 1 | Ashley@Glow
            new Booking
            {
                Id = BkgCompletedRated, SalonId = SlnGlow, MasterId = MstAshley, UserId = UsrClient1,
                ClientName = "Alice Johnson", ClientPhone = "+14155550301", ClientEmail = "alice.seed@bookio.dev",
                BookingDate = past21Mon, StartTime = new TimeOnly(9,0), EndTime = new TimeOnly(10,0),
                TotalPrice = 85, TotalDurationMinutes = 60, Status = BookingStatus.Completed,
                CompletedAt = past21Mon.ToDateTime(new TimeOnly(10,0), DateTimeKind.Utc),
                CreatedAt   = past21Mon.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-1),
                UpdatedAt   = past21Mon.ToDateTime(new TimeOnly(10,0), DateTimeKind.Utc),
            },
            // 2. Past | Completed | NOT Rated | Single service | Client 2 | Jessica@Glow
            new Booking
            {
                Id = BkgCompletedUnrated, SalonId = SlnGlow, MasterId = MstJessica, UserId = UsrClient2,
                ClientName = "Bob Smith", ClientPhone = "+14155550302", ClientEmail = "bob.seed@bookio.dev",
                BookingDate = past21Mon, StartTime = new TimeOnly(10,0), EndTime = new TimeOnly(11,0),
                TotalPrice = 55, TotalDurationMinutes = 60, Status = BookingStatus.Completed,
                CompletedAt = past21Mon.ToDateTime(new TimeOnly(11,0), DateTimeKind.Utc),
                CreatedAt   = past21Mon.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-2),
                UpdatedAt   = past21Mon.ToDateTime(new TimeOnly(11,0), DateTimeKind.Utc),
            },
            // 3. Past | Completed | Rated | Multi-service (haircut+eyebrows) | Client 2 | Lauren@Glow
            new Booking
            {
                Id = BkgCompletedMultiSvc, SalonId = SlnGlow, MasterId = MstLauren, UserId = UsrClient2,
                ClientName = "Bob Smith", ClientPhone = "+14155550302", ClientEmail = "bob.seed@bookio.dev",
                BookingDate = past7Wed, StartTime = new TimeOnly(11,0), EndTime = new TimeOnly(12,30),
                TotalPrice = 135, TotalDurationMinutes = 90, Status = BookingStatus.Completed,
                CompletedAt = past7Wed.ToDateTime(new TimeOnly(12,30), DateTimeKind.Utc),
                CreatedAt   = past7Wed.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-1),
                UpdatedAt   = past7Wed.ToDateTime(new TimeOnly(12,30), DateTimeKind.Utc),
            },
            // 4. Past | Completed | Anonymous (no UserId) | Single service | Ashley@Glow
            new Booking
            {
                Id = BkgCompletedAnonymous, SalonId = SlnGlow, MasterId = MstAshley, UserId = null,
                ClientName = "Walk-in Customer", ClientPhone = "+10000000001",
                BookingDate = past7Fri, StartTime = new TimeOnly(14,0), EndTime = new TimeOnly(15,0),
                TotalPrice = 85, TotalDurationMinutes = 60, Status = BookingStatus.Completed,
                CompletedAt = past7Fri.ToDateTime(new TimeOnly(15,0), DateTimeKind.Utc),
                CreatedAt   = past7Fri.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-1),
                UpdatedAt   = past7Fri.ToDateTime(new TimeOnly(15,0), DateTimeKind.Utc),
            },
            // 5. Past | CancelledByClient | With reason | Client 1 | Lauren@Luxe
            new Booking
            {
                Id = BkgCancelledByClient, SalonId = SlnLuxe, MasterId = MstLauren, UserId = UsrClient1,
                ClientName = "Alice Johnson", ClientPhone = "+14155550301", ClientEmail = "alice.seed@bookio.dev",
                BookingDate = past14Mon, StartTime = new TimeOnly(10,0), EndTime = new TimeOnly(11,0),
                TotalPrice = 95, TotalDurationMinutes = 60, Status = BookingStatus.CancelledByClient,
                CancelledAt       = past14Mon.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-1),
                CancellationReason = "Schedule conflict — rescheduling for next week",
                CreatedAt = past14Mon.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-3),
                UpdatedAt = past14Mon.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-1),
            },
            // 6. Past | CancelledByMaster | With reason | Client 2 | Ashley@Glow
            new Booking
            {
                Id = BkgCancelledByMaster, SalonId = SlnGlow, MasterId = MstAshley, UserId = UsrClient2,
                ClientName = "Bob Smith", ClientPhone = "+14155550302", ClientEmail = "bob.seed@bookio.dev",
                BookingDate = past7Mon, StartTime = new TimeOnly(9,0), EndTime = new TimeOnly(11,0),
                TotalPrice = 220, TotalDurationMinutes = 120, Status = BookingStatus.CancelledByMaster,
                CancelledAt       = past7Mon.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-1),
                CancellationReason = "Master called in sick",
                CreatedAt = past7Mon.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-4),
                UpdatedAt = past7Mon.ToDateTime(new TimeOnly(8,0), DateTimeKind.Utc).AddDays(-1),
            },
            // 7. Future | Confirmed | Single service | Client 1 | Ashley@Glow | next Tuesday
            new Booking
            {
                Id = BkgFutureConfirmed1, SalonId = SlnGlow, MasterId = MstAshley, UserId = UsrClient1,
                ClientName = "Alice Johnson", ClientPhone = "+14155550301", ClientEmail = "alice.seed@bookio.dev",
                BookingDate = futTue, StartTime = new TimeOnly(9,0), EndTime = new TimeOnly(10,0),
                TotalPrice = 85, TotalDurationMinutes = 60, Status = BookingStatus.Confirmed,
                CreatedAt = now.AddDays(-1), UpdatedAt = now.AddDays(-1),
            },
            // 8. Future | Confirmed | Multi-service (manicure+eyebrows) | Client 2 | Jessica@Glow | next Wednesday
            new Booking
            {
                Id = BkgFutureConfirmed2, SalonId = SlnGlow, MasterId = MstJessica, UserId = UsrClient2,
                ClientName = "Bob Smith", ClientPhone = "+14155550302", ClientEmail = "bob.seed@bookio.dev",
                BookingDate = futWed, StartTime = new TimeOnly(10,0), EndTime = new TimeOnly(11,30),
                TotalPrice = 90, TotalDurationMinutes = 90, Status = BookingStatus.Confirmed,
                CreatedAt = now.AddDays(-2), UpdatedAt = now.AddDays(-2),
            },
            // 9. Future | Confirmed | Anonymous (no UserId) | Lauren@Glow | next Thursday
            new Booking
            {
                Id = BkgFutureAnonymous, SalonId = SlnGlow, MasterId = MstLauren, UserId = null,
                ClientName = "Jane Doe", ClientPhone = "+19995551234",
                BookingDate = futThu, StartTime = new TimeOnly(11,0), EndTime = new TimeOnly(12,0),
                TotalPrice = 95, TotalDurationMinutes = 60, Status = BookingStatus.Confirmed,
                CreatedAt = now.AddDays(-1), UpdatedAt = now.AddDays(-1),
            },
            // 10. Future | Pending (edge case — manually left in Pending state) | Client 1 | Lauren@Glow | 2 weeks out
            new Booking
            {
                Id = BkgFuturePending, SalonId = SlnGlow, MasterId = MstLauren, UserId = UsrClient1,
                ClientName = "Alice Johnson", ClientPhone = "+14155550301", ClientEmail = "alice.seed@bookio.dev",
                BookingDate = futMon2, StartTime = new TimeOnly(11,0), EndTime = new TimeOnly(12,30),
                TotalPrice = 120, TotalDurationMinutes = 90, Status = BookingStatus.Pending,
                CreatedAt = now, UpdatedAt = now,
            },
            // 11. Future | Confirmed | Cross-salon | Client 1 | Ashley@Luxe | next Saturday
            new Booking
            {
                Id = BkgLuxeConfirmed, SalonId = SlnLuxe, MasterId = MstAshley, UserId = UsrClient1,
                ClientName = "Alice Johnson", ClientPhone = "+14155550301", ClientEmail = "alice.seed@bookio.dev",
                BookingDate = futSat, StartTime = new TimeOnly(14,0), EndTime = new TimeOnly(15,0),
                TotalPrice = 85, TotalDurationMinutes = 60, Status = BookingStatus.Confirmed,
                CreatedAt = now.AddDays(-1), UpdatedAt = now.AddDays(-1),
            },
        });

        // ── BookingServices (line items — reference MasterService GUIDs) ───────
        await db.BookingServices.AddRangeAsync(new[]
        {
            // BkgCompletedRated: haircut
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgCompletedRated,    MasterServiceId = MsAshleyHaircut,   Price = 85,  DurationMinutes = 60 },
            // BkgCompletedUnrated: manicure
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgCompletedUnrated,  MasterServiceId = MsJessicaManicure, Price = 55,  DurationMinutes = 60 },
            // BkgCompletedMultiSvc: haircut + eyebrows
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgCompletedMultiSvc, MasterServiceId = MsLaurenHaircut,   Price = 95,  DurationMinutes = 60 },
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgCompletedMultiSvc, MasterServiceId = MsLaurenEyebrows,  Price = 40,  DurationMinutes = 30 },
            // BkgCompletedAnonymous: haircut
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgCompletedAnonymous, MasterServiceId = MsAshleyHaircut,  Price = 85,  DurationMinutes = 60 },
            // BkgCancelledByClient: haircut (Lauren@Luxe)
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgCancelledByClient,  MasterServiceId = MsLaurenHaircut,  Price = 95,  DurationMinutes = 60 },
            // BkgCancelledByMaster: coloring
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgCancelledByMaster,  MasterServiceId = MsAshleyColoring, Price = 220, DurationMinutes = 120 },
            // BkgFutureConfirmed1: haircut
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgFutureConfirmed1,  MasterServiceId = MsAshleyHaircut,  Price = 85,  DurationMinutes = 60 },
            // BkgFutureConfirmed2: manicure + eyebrows
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgFutureConfirmed2,  MasterServiceId = MsJessicaManicure, Price = 55, DurationMinutes = 60 },
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgFutureConfirmed2,  MasterServiceId = MsJessicaEyebrows, Price = 35, DurationMinutes = 30 },
            // BkgFutureAnonymous: haircut (Lauren)
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgFutureAnonymous,   MasterServiceId = MsLaurenHaircut,  Price = 95,  DurationMinutes = 60 },
            // BkgFuturePending: massage
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgFuturePending,     MasterServiceId = MsLaurenMassage,  Price = 120, DurationMinutes = 90 },
            // BkgLuxeConfirmed: haircut (Ashley@Luxe)
            new BookingService { Id = Guid.NewGuid(), BookingId = BkgLuxeConfirmed,     MasterServiceId = MsAshleyHaircut,  Price = 85,  DurationMinutes = 60 },
        });

        // ── MasterRatings ─────────────────────────────────────────────────────
        await db.MasterRatings.AddRangeAsync(new[]
        {
            // Linked to a completed booking
            new MasterRating { Id = RtgAshleyLinked,   MasterId = MstAshley,  BookingId = BkgCompletedRated,    ClientName = "Alice Johnson", Rating = 5, Comment = "Ashley is absolutely amazing! Best haircut I've had in years.",         CreatedAt = now.AddDays(-20) },
            new MasterRating { Id = RtgLaurenLinked,   MasterId = MstLauren,  BookingId = BkgCompletedMultiSvc, ClientName = "Bob Smith",     Rating = 4, Comment = "Great precision work, very professional. Eyebrow shaping was perfect.", CreatedAt = now.AddDays(-10) },
            // Standalone ratings — no booking FK (ClientName is free text)
            new MasterRating { Id = RtgAshleyStdalone1, MasterId = MstAshley,  BookingId = null, ClientName = "Megan T.",     Rating = 5, Comment = "Perfect balayage, exactly what I wanted. Will definitely be back!", CreatedAt = now.AddDays(-5) },
            new MasterRating { Id = RtgAshleyStdalone2, MasterId = MstAshley,  BookingId = null, ClientName = "Rachel K.",    Rating = 4, Comment = "Great results and very professional. Slightly longer wait than expected.", CreatedAt = now.AddDays(-2) },
            new MasterRating { Id = RtgJessicaStdalone, MasterId = MstJessica, BookingId = null, ClientName = "Stephanie R.", Rating = 5, Comment = "Best manicure in the city — super clean and precise work.",            CreatedAt = now.AddDays(-7) },
            new MasterRating { Id = RtgLaurenStdalone,  MasterId = MstLauren,  BookingId = null, ClientName = "Nicole B.",    Rating = 5, Comment = "Lauren is a true professional. Highly recommend to anyone!",           CreatedAt = now.AddDays(-6) },
        });

        await db.SaveChangesAsync();
    }

    // ── Clear ─────────────────────────────────────────────────────────────────

    public static async Task ClearAsync(AppDbContext db, UserManager<AppUser> userManager)
    {
        // Delete in dependency order (leaf tables first)

        // Ratings linked to our bookings
        var ratingIds = new[] { RtgAshleyLinked, RtgLaurenLinked, RtgAshleyStdalone1, RtgAshleyStdalone2, RtgJessicaStdalone, RtgLaurenStdalone };
        await db.MasterRatings.Where(r => ratingIds.Contains(r.Id)).ExecuteDeleteAsync();

        // BookingServices
        var bookingIds = new[] { BkgCompletedRated, BkgCompletedUnrated, BkgCompletedMultiSvc, BkgCompletedAnonymous, BkgCancelledByClient, BkgCancelledByMaster, BkgFutureConfirmed1, BkgFutureConfirmed2, BkgFutureAnonymous, BkgFuturePending, BkgLuxeConfirmed };
        await db.BookingServices.Where(bs => bookingIds.Contains(bs.BookingId)).ExecuteDeleteAsync();

        // Bookings
        await db.Bookings.Where(b => bookingIds.Contains(b.Id)).ExecuteDeleteAsync();

        var smIds = new[] { SmGlowAshley, SmGlowJessica, SmGlowLauren, SmLuxeAshley, SmLuxeLauren, SmZenSofia };

        // Time offs + date override slots + date overrides + weekly slots
        await db.MasterTimeOffs.Where(t => t.Id == ToffSofiaVacation).ExecuteDeleteAsync();
        // Slots are cascade-deleted by MasterDateOverrides (OnDelete.Cascade) — delete overrides directly
        await db.MasterDateOverrides.Where(o => o.Id == OvrAshleyDayOff || o.Id == OvrLaurenShortDay).ExecuteDeleteAsync();
        await db.MasterWeeklySlots.Where(ws => smIds.Contains(ws.SalonMasterId)).ExecuteDeleteAsync();

        // MasterServices
        var msIds = new[] { MsAshleyHaircut, MsAshleyColoring, MsJessicaManicure, MsJessicaPedicure, MsJessicaEyebrows, MsLaurenHaircut, MsLaurenEyebrows, MsLaurenMassage, MsSofiaMassage, MsSofiaFacial, MsNoahHaircut };
        await db.MasterServices.Where(ms => msIds.Contains(ms.Id)).ExecuteDeleteAsync();

        // SalonMasters
        await db.SalonMasters.Where(sm => smIds.Contains(sm.Id)).ExecuteDeleteAsync();

        // Masters
        var masterIds = new[] { MstAshley, MstJessica, MstLauren, MstSofia, MstNoah };
        await db.Masters.Where(m => masterIds.Contains(m.Id)).ExecuteDeleteAsync();

        // Salons
        var salonIds = new[] { SlnGlow, SlnLuxe, SlnZen };
        await db.Salons.Where(s => salonIds.Contains(s.Id)).ExecuteDeleteAsync();

        // Services
        var serviceIds = new[] { SvcHaircut, SvcColoring, SvcManicure, SvcPedicure, SvcEyebrows, SvcMassage, SvcFacial };
        await db.Services.Where(s => serviceIds.Contains(s.Id)).ExecuteDeleteAsync();

        // AppUsers (master + admin + client accounts)
        var userIds = new[]
        {
            UsrSuperAdmin,
            UsrAshley, UsrJessica, UsrLauren, UsrSofia, UsrNoah,
            UsrSalonAdminGlow, UsrSalonAdminLuxe, UsrClient1, UsrClient2,
        };
        foreach (var uid in userIds)
        {
            var user = await userManager.FindByIdAsync(uid.ToString());
            if (user != null) await userManager.DeleteAsync(user);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static async Task CreateUserAsync(UserManager<AppUser> userManager, AppUser user, string password)
    {
        if (await userManager.FindByIdAsync(user.Id.ToString()) == null)
            await userManager.CreateAsync(user, password);
    }

    private static DateOnly GetNextWeekday(DateOnly from, DayOfWeek target)
    {
        var d = from;
        while (d.DayOfWeek != target) d = d.AddDays(1);
        return d;
    }

    private static DateOnly GetPrevWeekday(DateOnly from, DayOfWeek target)
    {
        var d = from;
        while (d.DayOfWeek != target) d = d.AddDays(-1);
        return d;
    }

}
