using Bookio.Application.DTOs;
using Bookio.Infrastructure.ApplicationServices;
using Bookio.Tests.Unit.Helpers;
using FluentAssertions;

namespace Bookio.Tests.Unit;

public class SalonMasterServiceTests
{
    private static LinkMasterToSalonRequest MakeRequest(Guid masterId) =>
        new(masterId);

    // ── Link ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Link_Succeeds_WhenSalonAndMasterExist()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);

        var (result, error) = await svc.LinkAsync(salon.Id, MakeRequest(master.Id));

        error.Should().BeNull();
        result.Should().NotBeNull();
        result!.SalonId.Should().Be(salon.Id);
        result.MasterId.Should().Be(master.Id);
    }

    [Fact]
    public async Task Link_CreatesWeeklySlots_FromSalonDefaults()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);

        var (result, _) = await svc.LinkAsync(salon.Id, MakeRequest(master.Id));

        var slots = db.MasterWeeklySlots
            .Where(w => w.SalonMasterId == result!.Id)
            .ToList();
        slots.Should().HaveCount(salon.WorkingDays.Count);
        slots.Should().OnlyContain(s => s.StartTime == salon.WorkingHoursStart && s.EndTime == salon.WorkingHoursEnd);
    }

    [Fact]
    public async Task Link_ReturnsError_WhenSalonNotFound()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);
        var master = await TestData.CreateMasterAsync(db);

        var (result, error) = await svc.LinkAsync(Guid.NewGuid(), MakeRequest(master.Id));

        error.Should().NotBeNull();
        result.Should().BeNull();
    }

    [Fact]
    public async Task Link_ReturnsError_WhenMasterNotFound()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);
        var salon = await TestData.CreateSalonAsync(db);

        var (result, error) = await svc.LinkAsync(salon.Id, MakeRequest(Guid.NewGuid()));

        error.Should().NotBeNull();
        result.Should().BeNull();
    }

    [Fact]
    public async Task Link_ReturnsError_WhenAlreadyLinked()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        var (result, error) = await svc.LinkAsync(salon.Id, MakeRequest(master.Id));

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task Link_ReactivatesInactiveLink()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);
        sm.IsActive = false;
        await db.SaveChangesAsync();

        var (result, error) = await svc.LinkAsync(salon.Id, MakeRequest(master.Id));

        error.Should().BeNull();
        result!.IsActive.Should().BeTrue();
    }

    // ── Unlink ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Unlink_SetsIsActiveFalse()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        var result = await svc.UnlinkAsync(salon.Id, master.Id);

        result.Should().BeTrue();
        db.SalonMasters.First().IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Unlink_ReturnsFalse_WhenNotFound()
    {
        var result = await new SalonMasterService(InMemoryDbHelper.Create())
            .UnlinkAsync(Guid.NewGuid(), Guid.NewGuid());
        result.Should().BeFalse();
    }
}
