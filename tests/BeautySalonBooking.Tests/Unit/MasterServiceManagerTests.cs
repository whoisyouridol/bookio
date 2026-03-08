using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Tests.Unit.Helpers;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Unit;

public class MasterServiceManagerTests
{
    // ── Add ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Add_Succeeds_WhenMasterAndServiceExist()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new MasterServiceManager(db);
        var master = await TestData.CreateMasterAsync(db);
        var service = await TestData.CreateServiceAsync(db, "Pedicure");
        var req = new AddMasterServiceRequest(service.Id, 1500, 90);

        var (result, error) = await svc.AddAsync(master.Id, req);

        error.Should().BeNull();
        result!.Price.Should().Be(1500);
        result.DurationMinutes.Should().Be(90);
        result.ServiceId.Should().Be(service.Id);
    }

    [Fact]
    public async Task Add_ReturnsError_WhenMasterNotFound()
    {
        var db = InMemoryDbHelper.Create();
        var service = await TestData.CreateServiceAsync(db);
        var (result, error) = await new MasterServiceManager(db)
            .AddAsync(Guid.NewGuid(), new AddMasterServiceRequest(service.Id, 100, 30));

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task Add_ReturnsError_WhenServiceNotFound()
    {
        var db = InMemoryDbHelper.Create();
        var master = await TestData.CreateMasterAsync(db);
        var (result, error) = await new MasterServiceManager(db)
            .AddAsync(master.Id, new AddMasterServiceRequest(Guid.NewGuid(), 100, 30));

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task Add_ReturnsError_WhenAlreadyActive()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new MasterServiceManager(db);
        var master = await TestData.CreateMasterAsync(db);
        var service = await TestData.CreateServiceAsync(db);
        await TestData.AddMasterServiceAsync(db, master.Id, service.Id);

        var (result, error) = await svc.AddAsync(master.Id, new AddMasterServiceRequest(service.Id, 999, 60));

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task Add_ReactivatesInactiveEntry()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new MasterServiceManager(db);
        var master = await TestData.CreateMasterAsync(db);
        var service = await TestData.CreateServiceAsync(db);
        var ms = await TestData.AddMasterServiceAsync(db, master.Id, service.Id);
        ms.IsActive = false;
        await db.SaveChangesAsync();

        var (result, error) = await svc.AddAsync(master.Id, new AddMasterServiceRequest(service.Id, 2000, 45));

        error.Should().BeNull();
        result!.Price.Should().Be(2000);
        result.IsActive.Should().BeTrue();
    }

    // ── Update ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ChangesPrice()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new MasterServiceManager(db);
        var master = await TestData.CreateMasterAsync(db);
        var service = await TestData.CreateServiceAsync(db);
        await TestData.AddMasterServiceAsync(db, master.Id, service.Id, price: 1000, duration: 60);

        var (result, error) = await svc.UpdateAsync(master.Id, service.Id, new UpdateMasterServiceRequest(3000, 45));

        error.Should().BeNull();
        result!.Price.Should().Be(3000);
        result.DurationMinutes.Should().Be(45);
    }

    // ── Remove ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Remove_SetsIsActiveFalse()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new MasterServiceManager(db);
        var master = await TestData.CreateMasterAsync(db);
        var service = await TestData.CreateServiceAsync(db);
        await TestData.AddMasterServiceAsync(db, master.Id, service.Id);

        var result = await svc.RemoveAsync(master.Id, service.Id);

        result.Should().BeTrue();
        db.MasterServices.First().IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Remove_ReturnsFalse_WhenNotFound()
    {
        var result = await new MasterServiceManager(InMemoryDbHelper.Create())
            .RemoveAsync(Guid.NewGuid(), Guid.NewGuid());
        result.Should().BeFalse();
    }
}
