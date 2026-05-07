using Bookio.Application.DTOs;
using Bookio.Domain.Entities;
using Bookio.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bookio.Infrastructure.ApplicationServices;

public class RatingService
{
    private readonly AppDbContext _db;

    public RatingService(AppDbContext db) => _db = db;

    public async Task<(RatingDto? result, string? error)> CreateAsync(Guid masterId, CreateRatingRequest req)
    {
        var masterExists = await _db.Masters.AnyAsync(m => m.Id == masterId);
        if (!masterExists) return (null, "Master not found");

        if (req.BookingId.HasValue)
        {
            var bookingExists = await _db.Bookings.AnyAsync(b => b.Id == req.BookingId && b.MasterId == masterId);
            if (!bookingExists) return (null, "Booking not found for this master");
        }

        var rating = new MasterRating
        {
            Id = Guid.NewGuid(),
            MasterId = masterId,
            BookingId = req.BookingId,
            ClientName = req.ClientName,
            Rating = req.Rating,
            Comment = req.Comment,
            CreatedAt = DateTime.UtcNow,
        };
        _db.MasterRatings.Add(rating);
        await _db.SaveChangesAsync();

        return (new RatingDto(rating.Id, rating.MasterId, rating.BookingId, rating.ClientName, rating.Rating, rating.Comment, rating.CreatedAt), null);
    }

    public async Task<List<RatingDto>> GetByMasterAsync(Guid masterId)
    {
        var ratings = await _db.MasterRatings
            .Where(r => r.MasterId == masterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return ratings.Select(r => new RatingDto(r.Id, r.MasterId, r.BookingId, r.ClientName, r.Rating, r.Comment, r.CreatedAt)).ToList();
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var rating = await _db.MasterRatings.FindAsync(id);
        if (rating == null) return false;
        _db.MasterRatings.Remove(rating);
        await _db.SaveChangesAsync();
        return true;
    }
}
