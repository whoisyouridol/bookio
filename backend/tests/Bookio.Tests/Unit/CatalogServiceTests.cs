using Bookio.Application.DTOs;
using Bookio.Infrastructure.ApplicationServices;
using Bookio.Tests.Unit.Helpers;
using FluentAssertions;

namespace Bookio.Tests.Unit;

public class CatalogServiceTests
{
    [Fact]
    public async Task GetAll_ReturnsAllServices()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new CatalogService(db);
        await TestData.CreateServiceAsync(db, "A");
        await TestData.CreateServiceAsync(db, "B");

        var result = await svc.GetAllAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task Create_PersistsService()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new CatalogService(db);
        var req = new CreateServiceRequest("Manicure", "Gel manicure", null);

        var result = await svc.CreateAsync(req);

        result.Id.Should().NotBeEmpty();
        result.Name.Should().Be("Manicure");
        db.Services.Should().HaveCount(1);
    }

    [Fact]
    public async Task Update_ModifiesFields()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new CatalogService(db);
        var service = await TestData.CreateServiceAsync(db, "Old Name");

        var result = await svc.UpdateAsync(service.Id, new UpdateServiceRequest("New Name", null, null));

        result!.Name.Should().Be("New Name");
    }

    [Fact]
    public async Task Update_ReturnsNull_WhenNotFound()
    {
        var result = await new CatalogService(InMemoryDbHelper.Create())
            .UpdateAsync(Guid.NewGuid(), new UpdateServiceRequest("X", null, null));
        result.Should().BeNull();
    }

    [Fact]
    public async Task Delete_RemovesService()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new CatalogService(db);
        var service = await TestData.CreateServiceAsync(db);

        var deleted = await svc.DeleteAsync(service.Id);

        deleted.Should().BeTrue();
        db.Services.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_ReturnsFalse_WhenNotFound()
    {
        var result = await new CatalogService(InMemoryDbHelper.Create()).DeleteAsync(Guid.NewGuid());
        result.Should().BeFalse();
    }
}
