using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Tests.Unit.Helpers;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Unit;

public class SalonServiceTests
{
    private static SalonService Build() => new(InMemoryDbHelper.Create());

    // ── GetAll ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ReturnsOnlyActiveSalons()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);

        var active = await TestData.CreateSalonAsync(db, "Active");
        var inactive = await TestData.CreateSalonAsync(db, "Inactive");
        inactive.IsActive = false;
        await db.SaveChangesAsync();

        var result = await svc.GetAllAsync();

        result.Should().HaveCount(1);
        result[0].Name.Should().Be("Active");
    }

    [Fact]
    public async Task GetAll_ReturnsEmptyList_WhenNoSalons()
    {
        var result = await Build().GetAllAsync();
        result.Should().BeEmpty();
    }

    // ── GetById ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ReturnsSalonDetail()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);
        var salon = await TestData.CreateSalonAsync(db);

        var result = await svc.GetByIdAsync(salon.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(salon.Id);
        result.Name.Should().Be(salon.Name);
    }

    [Fact]
    public async Task GetById_ReturnsNull_WhenNotFound()
    {
        var result = await Build().GetByIdAsync(Guid.NewGuid());
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetById_IncludesActiveMasters()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        var result = await svc.GetByIdAsync(salon.Id);

        result!.Masters.Should().HaveCount(1);
        result.Masters[0].MasterId.Should().Be(master.Id);
    }

    // ── Create ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_PersistsAndReturnsSalon()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);
        var req = new CreateSalonRequest("My Salon", null, "123 Main St", null, null,
            "09:00", "21:00", ["Monday", "Tuesday"], null, null, null, null, null, null);

        var result = await svc.CreateAsync(req);

        result.Id.Should().NotBeEmpty();
        result.Name.Should().Be("My Salon");
        result.WorkingHoursStart.Should().Be("09:00");
        result.IsActive.Should().BeTrue();
        db.Salons.Should().HaveCount(1);
    }

    // ── Update ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ModifiesFields()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);
        var salon = await TestData.CreateSalonAsync(db);

        var req = new UpdateSalonRequest("Renamed", null, "New Address", null, null,
            "10:00", "20:00", ["Friday"], null, null, null, null, null, null);

        var result = await svc.UpdateAsync(salon.Id, req);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Renamed");
        result.Address.Should().Be("New Address");
        result.WorkingHoursStart.Should().Be("10:00");
    }

    [Fact]
    public async Task Update_ReturnsNull_WhenNotFound()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);
        var req = new UpdateSalonRequest("X", null, "X", null, null, "09:00", "21:00", ["Monday"], null, null, null, null, null, null);

        var result = await svc.UpdateAsync(Guid.NewGuid(), req);

        result.Should().BeNull();
    }

    // ── Delete ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_SetsIsActiveFalse()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);
        var salon = await TestData.CreateSalonAsync(db);

        var deleted = await svc.DeleteAsync(salon.Id);

        deleted.Should().BeTrue();
        db.Salons.Find(salon.Id)!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Delete_ReturnsFalse_WhenNotFound()
    {
        var result = await Build().DeleteAsync(Guid.NewGuid());
        result.Should().BeFalse();
    }

    // ── GetMasters / GetServices ─────────────────────────────────────────────

    [Fact]
    public async Task GetMasters_ReturnsOnlyActiveMasters()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var sm = await TestData.LinkMasterAsync(db, salon.Id, master.Id);

        var result = await svc.GetMastersAsync(salon.Id);
        result.Should().HaveCount(1);

        sm.IsActive = false;
        await db.SaveChangesAsync();

        result = await svc.GetMastersAsync(salon.Id);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetServices_ReturnsServicesOfMastersInSalon()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new SalonService(db);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.LinkMasterAsync(db, salon.Id, master.Id);
        var service = await TestData.CreateServiceAsync(db);
        await TestData.AddMasterServiceAsync(db, master.Id, service.Id);

        var result = await svc.GetServicesAsync(salon.Id);

        result.Should().HaveCount(1);
        result[0].ServiceId.Should().Be(service.Id);
    }
}
