using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Tests.Unit.Helpers;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Unit;

public class RatingServiceTests
{
    // ── Create ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_PersistsRating()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new RatingService(db);
        var master = await TestData.CreateMasterAsync(db);
        var req = new CreateRatingRequest(null, "Alice", 5, "Excellent!");

        var (result, error) = await svc.CreateAsync(master.Id, req);

        error.Should().BeNull();
        result.Should().NotBeNull();
        result!.Rating.Should().Be(5);
        result.ClientName.Should().Be("Alice");
        result.Comment.Should().Be("Excellent!");
        db.MasterRatings.Should().HaveCount(1);
    }

    [Fact]
    public async Task Create_ReturnsError_WhenMasterNotFound()
    {
        var (result, error) = await new RatingService(InMemoryDbHelper.Create())
            .CreateAsync(Guid.NewGuid(), new CreateRatingRequest(null, "Bob", 4, null));

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task Create_LinksToBooking_WhenBookingIdProvided()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new RatingService(db);
        var master = await TestData.CreateMasterAsync(db);
        var salon = await TestData.CreateSalonAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Completed);

        var (result, error) = await svc.CreateAsync(master.Id,
            new CreateRatingRequest(booking.Id, "Carol", 3, null));

        error.Should().BeNull();
        result!.BookingId.Should().Be(booking.Id);
    }

    [Fact]
    public async Task Create_ReturnsError_WhenBookingBelongsToDifferentMaster()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new RatingService(db);
        var master1 = await TestData.CreateMasterAsync(db, "M1");
        var master2 = await TestData.CreateMasterAsync(db, "M2");
        var salon = await TestData.CreateSalonAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master2.Id);

        var (result, error) = await svc.CreateAsync(master1.Id,
            new CreateRatingRequest(booking.Id, "Dan", 5, null));

        error.Should().NotBeNull();
    }

    // ── GetByMaster ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByMaster_ReturnsRatingsOrderedByDate()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new RatingService(db);
        var master = await TestData.CreateMasterAsync(db);
        db.MasterRatings.Add(new Domain.Entities.MasterRating
        {
            Id = Guid.NewGuid(), MasterId = master.Id, ClientName = "Old", Rating = 3,
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        });
        db.MasterRatings.Add(new Domain.Entities.MasterRating
        {
            Id = Guid.NewGuid(), MasterId = master.Id, ClientName = "New", Rating = 5,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var result = await svc.GetByMasterAsync(master.Id);

        result.Should().HaveCount(2);
        result[0].ClientName.Should().Be("New"); // most recent first
    }

    [Fact]
    public async Task GetByMaster_ReturnsEmpty_WhenNoRatings()
    {
        var db = InMemoryDbHelper.Create();
        var master = await TestData.CreateMasterAsync(db);
        var result = await new RatingService(db).GetByMasterAsync(master.Id);
        result.Should().BeEmpty();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_RemovesRating()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new RatingService(db);
        var master = await TestData.CreateMasterAsync(db);
        var rating = new Domain.Entities.MasterRating
        {
            Id = Guid.NewGuid(), MasterId = master.Id, ClientName = "X", Rating = 4,
            CreatedAt = DateTime.UtcNow
        };
        db.MasterRatings.Add(rating);
        await db.SaveChangesAsync();

        var deleted = await svc.DeleteAsync(rating.Id);

        deleted.Should().BeTrue();
        db.MasterRatings.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_ReturnsFalse_WhenNotFound()
    {
        var result = await new RatingService(InMemoryDbHelper.Create()).DeleteAsync(Guid.NewGuid());
        result.Should().BeFalse();
    }
}
