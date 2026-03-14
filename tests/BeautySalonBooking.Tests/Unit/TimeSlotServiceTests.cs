using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Tests.Unit.Helpers;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Unit;

public class TimeSlotServiceTests
{
    private static TimeSlotService CreateService()
    {
        var db = InMemoryDbHelper.Create();
        return new TimeSlotService(db, new AvailabilityService(db));
    }

    // ── Generate ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Generate_CreatesCorrectNumberOfSlots()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        // Monday 2026-03-09, working hours 09-18, slot = 60 min → 9 slots
        var monday = new DateOnly(2026, 3, 9);
        var req = new GenerateSlotsRequest(
            monday.ToString("yyyy-MM-dd"),
            monday.ToString("yyyy-MM-dd"),
            60);

        var (count, error) = await svc.GenerateAsync(salon.Id, master.Id, req);

        error.Should().BeNull();
        count.Should().Be(9);
        db.TimeSlots.Should().HaveCount(9);
    }

    [Fact]
    public async Task Generate_SkipsNonWorkingDays()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        // Saturday 2026-03-14 - not in WeekDays (Mon-Fri)
        var saturday = new DateOnly(2026, 3, 14);
        var req = new GenerateSlotsRequest(
            saturday.ToString("yyyy-MM-dd"),
            saturday.ToString("yyyy-MM-dd"),
            60);

        var (count, error) = await svc.GenerateAsync(salon.Id, master.Id, req);

        count.Should().Be(0);
        db.TimeSlots.Should().BeEmpty();
    }

    [Fact]
    public async Task Generate_SkipsDuplicateSlots()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        var monday = new DateOnly(2026, 3, 9);
        // pre-create one slot
        await TestData.CreateSlotsAsync(db, sm.Id, monday, new TimeOnly(9, 0), new TimeOnly(10, 0), 60);

        var req = new GenerateSlotsRequest(
            monday.ToString("yyyy-MM-dd"),
            monday.ToString("yyyy-MM-dd"),
            60);

        var (count, _) = await svc.GenerateAsync(salon.Id, master.Id, req);

        count.Should().Be(8); // 9 total - 1 already exists
    }

    [Fact]
    public async Task Generate_ReturnsError_WhenLinkNotFound()
    {
        var (count, error) = await CreateService()
            .GenerateAsync(Guid.NewGuid(), Guid.NewGuid(),
                new GenerateSlotsRequest("2026-03-09", "2026-03-09", 60));

        error.Should().NotBeNull();
    }

    // ── GetAvailable ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAvailable_ReturnsAllAvailableSlots_WhenNoServiceFilter()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        var date = new DateOnly(2026, 3, 9);
        await TestData.CreateSlotsAsync(db, sm.Id, date, new TimeOnly(9, 0), new TimeOnly(12, 0), 60);

        var (slots, error) = await svc.GetAvailableAsync(salon.Id, master.Id, "2026-03-09", null);

        error.Should().BeNull();
        slots.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetAvailable_FiltersSlots_ByServiceDuration()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);
        var service = await TestData.CreateServiceAsync(db);
        var ms = await TestData.AddMasterServiceAsync(db, master.Id, service.Id, duration: 120); // 2h

        var date = new DateOnly(2026, 3, 9);
        // Create 3 x 60-min slots = 3h total; 2h bookings can start at slots 1 and 2
        await TestData.CreateSlotsAsync(db, sm.Id, date, new TimeOnly(9, 0), new TimeOnly(12, 0), 60);

        var (slots, error) = await svc.GetAvailableAsync(salon.Id, master.Id, "2026-03-09", [service.Id]);

        error.Should().BeNull();
        slots.Should().HaveCount(2); // 09:00 and 10:00 can accommodate 2h
    }

    [Fact]
    public async Task GetAvailable_ReturnsError_WhenLinkNotFound()
    {
        var (slots, error) = await CreateService()
            .GetAvailableAsync(Guid.NewGuid(), Guid.NewGuid(), "2026-03-09", null);

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAvailable_ReturnsError_WhenInvalidDate()
    {
        var db = InMemoryDbHelper.Create();
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        var (slots, error) = await new TimeSlotService(db, new AvailabilityService(db))
            .GetAvailableAsync(salon.Id, master.Id, "not-a-date", null);

        error.Should().NotBeNull();
    }

    // ── UpdateStatus ─────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStatus_ChangesSlotStatus()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);
        var slots = await TestData.CreateSlotsAsync(db, sm.Id,
            new DateOnly(2026, 3, 9), new TimeOnly(9, 0), new TimeOnly(10, 0), 60);

        var (result, error) = await svc.UpdateStatusAsync(slots[0].Id, new UpdateSlotStatusRequest("Blocked"));

        error.Should().BeNull();
        result!.Status.Should().Be("Blocked");
        db.TimeSlots.Find(slots[0].Id)!.Status.Should().Be(TimeSlotStatus.Blocked);
    }

    [Fact]
    public async Task UpdateStatus_ReturnsError_WhenInvalidStatus()
    {
        var (result, error) = await CreateService()
            .UpdateStatusAsync(Guid.NewGuid(), new UpdateSlotStatusRequest("Invalid"));

        error.Should().NotBeNull();
    }

    // ── Delete ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_RemovesSlot()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);
        var slots = await TestData.CreateSlotsAsync(db, sm.Id,
            new DateOnly(2026, 3, 9), new TimeOnly(9, 0), new TimeOnly(10, 0), 60);

        var deleted = await svc.DeleteAsync(slots[0].Id);

        deleted.Should().BeTrue();
        db.TimeSlots.Should().BeEmpty();
    }

    // ── Generate with Availability Rules ────────────────────────────────────

    [Fact]
    public async Task Generate_UsesAvailabilityRules_WhenConfigured()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        // Configure weekly schedule: Monday 10:00-14:00 (4h = 4 x 60-min slots)
        db.MasterWeeklySlots.Add(new MasterWeeklySlot
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(14, 0)
        });
        await db.SaveChangesAsync();

        // Monday 2026-03-09
        var monday = new DateOnly(2026, 3, 9);
        var (count, error) = await svc.GenerateAsync(salon.Id, master.Id,
            new GenerateSlotsRequest(monday.ToString("yyyy-MM-dd"), monday.ToString("yyyy-MM-dd"), 60));

        error.Should().BeNull();
        count.Should().Be(4); // 10-11, 11-12, 12-13, 13-14
    }

    [Fact]
    public async Task Generate_RespectsTimeOff_WithAvailabilityRules()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        // Weekly: Monday 09-18
        db.MasterWeeklySlots.Add(new MasterWeeklySlot
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(18, 0)
        });
        // Time off covering Monday 2026-03-09
        db.MasterTimeOffs.Add(new MasterTimeOff
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            StartDate = new DateOnly(2026, 3, 9), EndDate = new DateOnly(2026, 3, 9)
        });
        await db.SaveChangesAsync();

        var (count, error) = await svc.GenerateAsync(salon.Id, master.Id,
            new GenerateSlotsRequest("2026-03-09", "2026-03-09", 60));

        error.Should().BeNull();
        count.Should().Be(0); // Time off blocks all slots
    }

    [Fact]
    public async Task Generate_RespectsDateOverride_WithAvailabilityRules()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        // Weekly: Monday 09-18 (normally 9 slots)
        db.MasterWeeklySlots.Add(new MasterWeeklySlot
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(18, 0)
        });
        // Override: Monday 2026-03-09 only 10-12 (2 slots)
        var ov = new MasterDateOverride
        {
            Id = Guid.NewGuid(), SalonMasterId = sm.Id,
            Date = new DateOnly(2026, 3, 9), IsDayOff = false
        };
        ov.Slots.Add(new MasterDateOverrideSlot
        {
            Id = Guid.NewGuid(), DateOverrideId = ov.Id,
            StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(12, 0)
        });
        db.MasterDateOverrides.Add(ov);
        await db.SaveChangesAsync();

        var (count, error) = await svc.GenerateAsync(salon.Id, master.Id,
            new GenerateSlotsRequest("2026-03-09", "2026-03-09", 60));

        error.Should().BeNull();
        count.Should().Be(2); // Override: 10-11, 11-12
    }

    [Fact]
    public async Task Generate_SplitShift_CreatesCorrectSlots()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        // Split shift: Monday 09-12 + 14-17 (3 + 3 = 6 x 60-min slots)
        db.MasterWeeklySlots.AddRange(
            new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = sm.Id, DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(12, 0) },
            new MasterWeeklySlot { Id = Guid.NewGuid(), SalonMasterId = sm.Id, DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(17, 0) }
        );
        await db.SaveChangesAsync();

        var (count, error) = await svc.GenerateAsync(salon.Id, master.Id,
            new GenerateSlotsRequest("2026-03-09", "2026-03-09", 60));

        error.Should().BeNull();
        count.Should().Be(6);
    }

    [Fact]
    public async Task Generate_FallsBackToLegacy_WhenNoAvailabilityRules()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new TimeSlotService(db, new AvailabilityService(db));
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);
        // No weekly slots configured → falls back to SalonMaster.WorkingHoursStart/End (09-18)

        var monday = new DateOnly(2026, 3, 9);
        var (count, error) = await svc.GenerateAsync(salon.Id, master.Id,
            new GenerateSlotsRequest(monday.ToString("yyyy-MM-dd"), monday.ToString("yyyy-MM-dd"), 60));

        error.Should().BeNull();
        count.Should().Be(9); // legacy: 09-18 = 9 x 60-min slots
    }
}
