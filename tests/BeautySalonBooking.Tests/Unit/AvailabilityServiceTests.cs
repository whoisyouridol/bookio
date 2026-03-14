using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Tests.Unit.Helpers;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Unit;

public class AvailabilityServiceTests
{
    private static async Task<(Infrastructure.Persistence.AppDbContext db, AvailabilityService svc, Salon salon, Master master, SalonMaster sm)> SetupAsync()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new AvailabilityService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);
        return (db, svc, salon, master, sm);
    }

    // ── Weekly Schedule ──────────────────────────────────────────────────────

    [Fact]
    public async Task SetWeeklySchedule_CreatesSlots()
    {
        var (_, svc, salon, master, sm) = await SetupAsync();

        var req = new SetWeeklyScheduleRequest(new List<WeeklySlotItemRequest>
        {
            new("Monday", "09:00", "13:00"),
            new("Monday", "14:00", "18:00"),
            new("Tuesday", "10:00", "17:00"),
        });

        var (result, error) = await svc.SetWeeklyScheduleAsync(salon.Id, master.Id, req);

        error.Should().BeNull();
        result.Should().HaveCount(3);
        result![0].DayOfWeek.Should().Be("Monday");
        result[0].StartTime.Should().Be("09:00");
    }

    [Fact]
    public async Task SetWeeklySchedule_ReplacesExisting()
    {
        var (db, svc, salon, master, sm) = await SetupAsync();

        // Set initial schedule
        await svc.SetWeeklyScheduleAsync(salon.Id, master.Id, new SetWeeklyScheduleRequest(new List<WeeklySlotItemRequest>
        {
            new("Monday", "09:00", "18:00"),
        }));

        // Replace with new schedule
        var (result, error) = await svc.SetWeeklyScheduleAsync(salon.Id, master.Id, new SetWeeklyScheduleRequest(new List<WeeklySlotItemRequest>
        {
            new("Wednesday", "10:00", "16:00"),
        }));

        error.Should().BeNull();
        result.Should().HaveCount(1);
        result![0].DayOfWeek.Should().Be("Wednesday");
        db.MasterWeeklySlots.Count().Should().Be(1);
    }

    [Fact]
    public async Task SetWeeklySchedule_RejectsOverlappingSlots()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var req = new SetWeeklyScheduleRequest(new List<WeeklySlotItemRequest>
        {
            new("Monday", "09:00", "14:00"),
            new("Monday", "13:00", "18:00"), // overlaps
        });

        var (result, error) = await svc.SetWeeklyScheduleAsync(salon.Id, master.Id, req);

        error.Should().Contain("Overlapping");
        result.Should().BeNull();
    }

    [Fact]
    public async Task SetWeeklySchedule_RejectsInvalidDay()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var req = new SetWeeklyScheduleRequest(new List<WeeklySlotItemRequest>
        {
            new("InvalidDay", "09:00", "18:00"),
        });

        var (result, error) = await svc.SetWeeklyScheduleAsync(salon.Id, master.Id, req);

        error.Should().Contain("Invalid day");
    }

    [Fact]
    public async Task SetWeeklySchedule_RejectsStartAfterEnd()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var req = new SetWeeklyScheduleRequest(new List<WeeklySlotItemRequest>
        {
            new("Monday", "18:00", "09:00"),
        });

        var (_, error) = await svc.SetWeeklyScheduleAsync(salon.Id, master.Id, req);

        error.Should().Contain("Start time must be before end time");
    }

    [Fact]
    public async Task GetWeeklySchedule_ReturnsSorted()
    {
        var (db, svc, salon, master, sm) = await SetupAsync();

        db.MasterWeeklySlots.AddRange(
            new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = sm.Id, DayOfWeek = DayOfWeek.Wednesday, StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(18, 0) },
            new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = sm.Id, DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(17, 0) }
        );
        await db.SaveChangesAsync();

        var result = await svc.GetWeeklyScheduleAsync(sm.Id);

        result.Should().HaveCount(2);
        result[0].DayOfWeek.Should().Be("Monday");
        result[1].DayOfWeek.Should().Be("Wednesday");
    }

    // ── Date Overrides ───────────────────────────────────────────────────────

    [Fact]
    public async Task UpsertDateOverride_CreatesOverrideWithSlots()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var req = new UpsertDateOverrideRequest("2026-04-01", false, new List<DateOverrideSlotItemRequest>
        {
            new("09:00", "12:00"),
            new("14:00", "17:00"),
        });

        var (result, error) = await svc.UpsertDateOverrideAsync(salon.Id, master.Id, req);

        error.Should().BeNull();
        result.Should().NotBeNull();
        result!.Date.Should().Be("2026-04-01");
        result.IsDayOff.Should().BeFalse();
        result.Slots.Should().HaveCount(2);
    }

    [Fact]
    public async Task UpsertDateOverride_CreatesDayOff()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var req = new UpsertDateOverrideRequest("2026-04-01", true, null);

        var (result, error) = await svc.UpsertDateOverrideAsync(salon.Id, master.Id, req);

        error.Should().BeNull();
        result!.IsDayOff.Should().BeTrue();
        result.Slots.Should().BeEmpty();
    }

    [Fact]
    public async Task UpsertDateOverride_UpdatesExisting()
    {
        var (db, svc, salon, master, _) = await SetupAsync();

        // Create initial
        await svc.UpsertDateOverrideAsync(salon.Id, master.Id,
            new UpsertDateOverrideRequest("2026-04-01", false, new List<DateOverrideSlotItemRequest> { new("09:00", "12:00") }));

        // Upsert to day off
        var (result, error) = await svc.UpsertDateOverrideAsync(salon.Id, master.Id,
            new UpsertDateOverrideRequest("2026-04-01", true, null));

        error.Should().BeNull();
        result!.IsDayOff.Should().BeTrue();
        db.MasterDateOverrides.Count().Should().Be(1);
    }

    [Fact]
    public async Task UpsertDateOverride_RejectsNonDayOffWithoutSlots()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var (_, error) = await svc.UpsertDateOverrideAsync(salon.Id, master.Id,
            new UpsertDateOverrideRequest("2026-04-01", false, null));

        error.Should().Contain("at least one time slot");
    }

    [Fact]
    public async Task DeleteDateOverride_RemovesOverride()
    {
        var (db, svc, salon, master, _) = await SetupAsync();

        var (created, _) = await svc.UpsertDateOverrideAsync(salon.Id, master.Id,
            new UpsertDateOverrideRequest("2026-04-01", true, null));

        var deleted = await svc.DeleteDateOverrideAsync(salon.Id, master.Id, created!.Id);

        deleted.Should().BeTrue();
        db.MasterDateOverrides.Count().Should().Be(0);
    }

    // ── Time Off ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateTimeOff_CreatesEntry()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var (result, error) = await svc.CreateTimeOffAsync(salon.Id, master.Id,
            new CreateTimeOffRequest("2026-04-10", "2026-04-15", "Vacation"));

        error.Should().BeNull();
        result.Should().NotBeNull();
        result!.StartDate.Should().Be("2026-04-10");
        result.EndDate.Should().Be("2026-04-15");
        result.Reason.Should().Be("Vacation");
    }

    [Fact]
    public async Task CreateTimeOff_RejectsOverlapping()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        await svc.CreateTimeOffAsync(salon.Id, master.Id,
            new CreateTimeOffRequest("2026-04-10", "2026-04-15", null));

        var (_, error) = await svc.CreateTimeOffAsync(salon.Id, master.Id,
            new CreateTimeOffRequest("2026-04-13", "2026-04-20", null));

        error.Should().Contain("overlaps");
    }

    [Fact]
    public async Task CreateTimeOff_RejectsStartAfterEnd()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var (_, error) = await svc.CreateTimeOffAsync(salon.Id, master.Id,
            new CreateTimeOffRequest("2026-04-15", "2026-04-10", null));

        error.Should().Contain("Start date must be before");
    }

    [Fact]
    public async Task UpdateTimeOff_ModifiesEntry()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        var (created, _) = await svc.CreateTimeOffAsync(salon.Id, master.Id,
            new CreateTimeOffRequest("2026-04-10", "2026-04-15", "Vacation"));

        var (result, error) = await svc.UpdateTimeOffAsync(salon.Id, master.Id, created!.Id,
            new UpdateTimeOffRequest("2026-04-11", "2026-04-16", "Extended vacation"));

        error.Should().BeNull();
        result!.StartDate.Should().Be("2026-04-11");
        result.Reason.Should().Be("Extended vacation");
    }

    [Fact]
    public async Task DeleteTimeOff_RemovesEntry()
    {
        var (db, svc, salon, master, _) = await SetupAsync();

        var (created, _) = await svc.CreateTimeOffAsync(salon.Id, master.Id,
            new CreateTimeOffRequest("2026-04-10", "2026-04-15", null));

        var deleted = await svc.DeleteTimeOffAsync(salon.Id, master.Id, created!.Id);

        deleted.Should().BeTrue();
        db.MasterTimeOffs.Count().Should().Be(0);
    }

    // ── Resolve ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Resolve_UsesWeeklySchedule()
    {
        var (db, svc, salon, master, sm) = await SetupAsync();

        db.MasterWeeklySlots.Add(new MasterWeeklySlot
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(18, 0)
        });
        await db.SaveChangesAsync();

        // 2026-03-16 is Monday
        var (result, error) = await svc.ResolveAsync(salon.Id, master.Id, "2026-03-16", "2026-03-16");

        error.Should().BeNull();
        result.Should().HaveCount(1);
        result![0].Source.Should().Be("weekly");
        result[0].Windows.Should().HaveCount(1);
        result[0].Windows[0].StartTime.Should().Be("09:00");
    }

    [Fact]
    public async Task Resolve_DateOverrideTakesPrecedenceOverWeekly()
    {
        var (db, svc, salon, master, sm) = await SetupAsync();

        // Weekly: Monday 09-18
        db.MasterWeeklySlots.Add(new MasterWeeklySlot
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(18, 0)
        });

        // Override: 2026-03-16 (Monday) 10-14
        var ov = new MasterDateOverride
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            Date = new DateOnly(2026, 3, 16), IsDayOff = false
        };
        ov.Slots.Add(new MasterDateOverrideSlot
        {
            Id = Guid.NewGuid(), DateOverrideId = ov.Id,
            StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(14, 0)
        });
        db.MasterDateOverrides.Add(ov);
        await db.SaveChangesAsync();

        var (result, _) = await svc.ResolveAsync(salon.Id, master.Id, "2026-03-16", "2026-03-16");

        result.Should().HaveCount(1);
        result![0].Source.Should().Be("override");
        result[0].Windows.Should().HaveCount(1);
        result[0].Windows[0].StartTime.Should().Be("10:00");
        result[0].Windows[0].EndTime.Should().Be("14:00");
    }

    [Fact]
    public async Task Resolve_TimeOffTakesPrecedenceOverAll()
    {
        var (db, svc, salon, master, sm) = await SetupAsync();

        // Weekly: Monday 09-18
        db.MasterWeeklySlots.Add(new MasterWeeklySlot
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(18, 0)
        });

        // Time off covering 2026-03-16
        db.MasterTimeOffs.Add(new MasterTimeOff
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            StartDate = new DateOnly(2026, 3, 15), EndDate = new DateOnly(2026, 3, 17),
            Reason = "Sick"
        });
        await db.SaveChangesAsync();

        var (result, _) = await svc.ResolveAsync(salon.Id, master.Id, "2026-03-16", "2026-03-16");

        result.Should().HaveCount(1);
        result![0].Source.Should().Be("timeoff");
        result[0].Windows.Should().BeEmpty();
    }

    [Fact]
    public async Task Resolve_DayOffOverride_ReturnsEmptyWindows()
    {
        var (db, svc, salon, master, sm) = await SetupAsync();

        db.MasterDateOverrides.Add(new MasterDateOverride
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            Date = new DateOnly(2026, 3, 16), IsDayOff = true
        });
        await db.SaveChangesAsync();

        var (result, _) = await svc.ResolveAsync(salon.Id, master.Id, "2026-03-16", "2026-03-16");

        result.Should().HaveCount(1);
        result![0].Source.Should().Be("off");
        result[0].Windows.Should().BeEmpty();
    }

    [Fact]
    public async Task Resolve_NoSchedule_OmitsDay()
    {
        var (_, svc, salon, master, _) = await SetupAsync();

        // No weekly slots, no overrides — Tuesday has nothing
        var (result, _) = await svc.ResolveAsync(salon.Id, master.Id, "2026-03-17", "2026-03-17");

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Resolve_MultiDayRange()
    {
        var (db, svc, salon, master, sm) = await SetupAsync();

        // Mon + Tue weekly
        db.MasterWeeklySlots.AddRange(
            new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = sm.Id, DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(17, 0) },
            new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = sm.Id, DayOfWeek = DayOfWeek.Tuesday, StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(16, 0) }
        );
        await db.SaveChangesAsync();

        // Mon 2026-03-16 to Tue 2026-03-17
        var (result, _) = await svc.ResolveAsync(salon.Id, master.Id, "2026-03-16", "2026-03-17");

        result.Should().HaveCount(2);
        result![0].Date.Should().Be("2026-03-16");
        result[1].Date.Should().Be("2026-03-17");
    }
}
