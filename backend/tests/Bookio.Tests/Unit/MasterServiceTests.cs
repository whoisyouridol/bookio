using Bookio.Application.DTOs;
using Bookio.Application.Interfaces;
using Bookio.Domain.Entities;
using Bookio.Infrastructure.Entities;
using Bookio.Tests.Unit.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using MasterSvc = Bookio.Infrastructure.ApplicationServices.MasterService;

namespace Bookio.Tests.Unit;

public class MasterServiceTests
{
    private static MasterSvc CreateService(Infrastructure.Persistence.AppDbContext db)
    {
        var store = new Mock<IUserStore<AppUser>>();
        var userManager = new Mock<UserManager<AppUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        var notifications = new Mock<INotificationService>();
        var logger = new Mock<ILogger<MasterSvc>>();
        return new MasterSvc(db, userManager.Object, notifications.Object, logger.Object);
    }

    // ── GetById ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ReturnsMasterWithRating()
    {
        var db = InMemoryDbHelper.Create();
        var svc = CreateService(db);
        var master = await TestData.CreateMasterAsync(db);
        db.MasterRatings.Add(new MasterRating
        {
            Id = Guid.NewGuid(), MasterId = master.Id,
            ClientName = "Alice", Rating = 5, CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var result = await svc.GetByIdAsync(master.Id);

        result.Should().NotBeNull();
        result!.AverageRating.Should().Be(5);
        result.RatingCount.Should().Be(1);
    }

    [Fact]
    public async Task GetById_ReturnsNull_WhenNotFound()
    {
        var result = await CreateService(InMemoryDbHelper.Create()).GetByIdAsync(Guid.NewGuid());
        result.Should().BeNull();
    }

    // ── Update ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ModifiesFields()
    {
        var db = InMemoryDbHelper.Create();
        var svc = CreateService(db);
        var master = await TestData.CreateMasterAsync(db);
        var req = new UpdateMasterRequest("photo.jpg", "Updated description", false);

        var result = await svc.UpdateAsync(master.Id, req);

        result.Should().NotBeNull();
        result!.Description.Should().Be("Updated description");
        result.AutoApproveBookings.Should().BeFalse();
        result.Photo.Should().Be("photo.jpg");
    }

    // ── Delete ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_SetsIsDeletedTrue()
    {
        var db = InMemoryDbHelper.Create();
        var svc = CreateService(db);
        var master = await TestData.CreateMasterAsync(db);

        var deleted = await svc.DeleteAsync(master.Id);

        deleted.Should().BeTrue();
        db.Masters.Find(master.Id)!.IsDeleted.Should().BeTrue();
    }

    // ── GetAverageRating ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetAverageRating_CalculatesCorrectly()
    {
        var db = InMemoryDbHelper.Create();
        var svc = CreateService(db);
        var master = await TestData.CreateMasterAsync(db);
        db.MasterRatings.AddRange(
            new MasterRating { Id = Guid.NewGuid(), MasterId = master.Id, ClientName = "A", Rating = 4, CreatedAt = DateTime.UtcNow },
            new MasterRating { Id = Guid.NewGuid(), MasterId = master.Id, ClientName = "B", Rating = 2, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var result = await svc.GetAverageRatingAsync(master.Id);

        result.Average.Should().Be(3);
        result.Count.Should().Be(2);
    }

    [Fact]
    public async Task GetAverageRating_ReturnsZero_WhenNoRatings()
    {
        var db = InMemoryDbHelper.Create();
        var svc = CreateService(db);
        var master = await TestData.CreateMasterAsync(db);

        var result = await svc.GetAverageRatingAsync(master.Id);

        result.Average.Should().Be(0);
        result.Count.Should().Be(0);
    }

    [Fact]
    public async Task GetServices_ReturnsOnlyActiveMasterServices()
    {
        var db = InMemoryDbHelper.Create();
        var svc = CreateService(db);
        var master = await TestData.CreateMasterAsync(db);
        var s1 = await TestData.CreateServiceAsync(db, "Haircut");
        var s2 = await TestData.CreateServiceAsync(db, "Coloring");
        await TestData.AddMasterServiceAsync(db, master.Id, s1.Id);
        var ms2 = await TestData.AddMasterServiceAsync(db, master.Id, s2.Id);
        ms2.IsActive = false;
        await db.SaveChangesAsync();

        var result = await svc.GetServicesAsync(master.Id);

        result.Should().HaveCount(1);
        result[0].ServiceId.Should().Be(s1.Id);
    }
}
