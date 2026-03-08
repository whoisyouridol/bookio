using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Tests.Unit.Helpers;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Unit;

public class SalonMasterServiceTests
{
    private static LinkMasterToSalonRequest MakeRequest(Guid masterId) =>
        new(masterId, "09:00", "18:00", ["Monday", "Tuesday"]);

    private static UpdateSalonMasterRequest MakeUpdateRequest() =>
        new("10:00", "20:00", ["Friday"]);

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

    // ── Update ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ChangesSchedule()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        var (result, error) = await svc.UpdateAsync(salon.Id, master.Id, MakeUpdateRequest());

        error.Should().BeNull();
        result!.WorkingHoursStart.Should().Be("10:00");
        result.WorkingHoursEnd.Should().Be("20:00");
    }

    [Fact]
    public async Task Update_ReturnsError_WhenLinkNotFound()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonMasterService(db);

        var (result, error) = await svc.UpdateAsync(Guid.NewGuid(), Guid.NewGuid(), MakeUpdateRequest());

        error.Should().NotBeNull();
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
