using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class MasterService
{
    private readonly AppDbContext _db;

    public MasterService(AppDbContext db) => _db = db;

    public async Task<List<MasterDto>> GetAllAsync()
    {
        var masters = await _db.Masters
            .Where(m => m.IsActive)
            .Include(m => m.Ratings)
            .OrderBy(m => m.LastName)
            .ToListAsync();

        return masters.Select(MapToDto).ToList();
    }

    public async Task<MasterDto?> GetByIdAsync(Guid id)
    {
        var master = await _db.Masters
            .Include(m => m.Ratings)
            .FirstOrDefaultAsync(m => m.Id == id);

        return master == null ? null : MapToDto(master);
    }

    public async Task<MasterDto> CreateAsync(CreateMasterRequest req)
    {
        var master = new Master
        {
            Id = Guid.NewGuid(),
            FirstName = req.FirstName,
            LastName = req.LastName,
            Phone = req.Phone,
            Photo = req.Photo,
            Description = req.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Masters.Add(master);
        await _db.SaveChangesAsync();
        return MapToDto(master);
    }

    public async Task<MasterDto?> UpdateAsync(Guid id, UpdateMasterRequest req)
    {
        var master = await _db.Masters.Include(m => m.Ratings).FirstOrDefaultAsync(m => m.Id == id);
        if (master == null) return null;

        master.FirstName = req.FirstName;
        master.LastName = req.LastName;
        master.Phone = req.Phone;
        master.Photo = req.Photo;
        master.Description = req.Description;
        master.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToDto(master);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var master = await _db.Masters.FindAsync(id);
        if (master == null) return false;
        master.IsActive = false;
        master.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<MasterServiceDto>> GetServicesAsync(Guid masterId)
    {
        var services = await _db.MasterServices
            .Include(ms => ms.Service)
            .Where(ms => ms.MasterId == masterId && ms.IsActive)
            .ToListAsync();

        return services.Select(ms => new MasterServiceDto(
            ms.Id, ms.MasterId, ms.ServiceId, ms.Service.Name, ms.Price, ms.DurationMinutes, ms.IsActive
        )).ToList();
    }

    public async Task<List<RatingDto>> GetRatingsAsync(Guid masterId)
    {
        var ratings = await _db.MasterRatings
            .Where(r => r.MasterId == masterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return ratings.Select(r => new RatingDto(r.Id, r.MasterId, r.BookingId, r.ClientName, r.Rating, r.Comment, r.CreatedAt)).ToList();
    }

    public async Task<AverageRatingDto> GetAverageRatingAsync(Guid masterId)
    {
        var ratings = await _db.MasterRatings.Where(r => r.MasterId == masterId).ToListAsync();
        if (!ratings.Any()) return new AverageRatingDto(0, 0);
        return new AverageRatingDto(ratings.Average(r => r.Rating), ratings.Count);
    }

    private static MasterDto MapToDto(Master m)
    {
        var avg = m.Ratings.Any() ? (double?)m.Ratings.Average(r => r.Rating) : null;
        return new MasterDto(m.Id, m.FirstName, m.LastName, m.Phone, m.Photo, m.Description, m.IsActive, m.CreatedAt, avg, m.Ratings.Count);
    }
}
