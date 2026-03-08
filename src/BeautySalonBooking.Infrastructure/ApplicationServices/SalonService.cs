using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class SalonService
{
    private readonly AppDbContext _db;

    public SalonService(AppDbContext db) => _db = db;

    public async Task<List<SalonDto>> GetAllAsync()
    {
        var salons = await _db.Salons.Where(s => s.IsActive).OrderBy(s => s.Name).ToListAsync();
        return salons.Select(MapToDto).ToList();
    }

    public async Task<SalonDetailDto?> GetByIdAsync(Guid id)
    {
        var salon = await _db.Salons
            .Include(s => s.SalonMasters.Where(sm => sm.IsActive))
                .ThenInclude(sm => sm.Master)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (salon == null) return null;

        var masters = salon.SalonMasters.Select(sm => new SalonMasterDto(
            sm.Id, sm.SalonId, sm.MasterId,
            sm.Master.FirstName, sm.Master.LastName,
            sm.WorkingHoursStart.ToString("HH:mm"),
            sm.WorkingHoursEnd.ToString("HH:mm"),
            sm.WorkingDays.Select(d => d.ToString()).ToList(),
            sm.IsActive
        )).ToList();

        return new SalonDetailDto(
            salon.Id, salon.Name, salon.Address,
            salon.GoogleMapsUrl, salon.YandexMapsUrl,
            salon.WorkingHoursStart.ToString("HH:mm"),
            salon.WorkingHoursEnd.ToString("HH:mm"),
            salon.WorkingDays.Select(d => d.ToString()).ToList(),
            salon.Photos, salon.Videos, salon.IsActive, salon.CreatedAt, masters);
    }

    public async Task<SalonDto> CreateAsync(CreateSalonRequest req)
    {
        var salon = new Salon
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Address = req.Address,
            GoogleMapsUrl = req.GoogleMapsUrl,
            YandexMapsUrl = req.YandexMapsUrl,
            WorkingHoursStart = TimeOnly.Parse(req.WorkingHoursStart),
            WorkingHoursEnd = TimeOnly.Parse(req.WorkingHoursEnd),
            WorkingDays = req.WorkingDays.Select(Enum.Parse<DayOfWeek>).ToList(),
            Photos = req.Photos ?? new(),
            Videos = req.Videos ?? new(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Salons.Add(salon);
        await _db.SaveChangesAsync();
        return MapToDto(salon);
    }

    public async Task<SalonDto?> UpdateAsync(Guid id, UpdateSalonRequest req)
    {
        var salon = await _db.Salons.FindAsync(id);
        if (salon == null) return null;

        salon.Name = req.Name;
        salon.Address = req.Address;
        salon.GoogleMapsUrl = req.GoogleMapsUrl;
        salon.YandexMapsUrl = req.YandexMapsUrl;
        salon.WorkingHoursStart = TimeOnly.Parse(req.WorkingHoursStart);
        salon.WorkingHoursEnd = TimeOnly.Parse(req.WorkingHoursEnd);
        salon.WorkingDays = req.WorkingDays.Select(Enum.Parse<DayOfWeek>).ToList();
        salon.Photos = req.Photos ?? new();
        salon.Videos = req.Videos ?? new();
        salon.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToDto(salon);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var salon = await _db.Salons.FindAsync(id);
        if (salon == null) return false;
        salon.IsActive = false;
        salon.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<SalonMasterDto>> GetMastersAsync(Guid salonId)
    {
        var sms = await _db.SalonMasters
            .Include(sm => sm.Master)
            .Where(sm => sm.SalonId == salonId && sm.IsActive)
            .ToListAsync();

        return sms.Select(sm => new SalonMasterDto(
            sm.Id, sm.SalonId, sm.MasterId,
            sm.Master.FirstName, sm.Master.LastName,
            sm.WorkingHoursStart.ToString("HH:mm"),
            sm.WorkingHoursEnd.ToString("HH:mm"),
            sm.WorkingDays.Select(d => d.ToString()).ToList(),
            sm.IsActive
        )).ToList();
    }

    public async Task<List<MasterServiceDto>> GetServicesAsync(Guid salonId)
    {
        var masterIds = await _db.SalonMasters
            .Where(sm => sm.SalonId == salonId && sm.IsActive)
            .Select(sm => sm.MasterId)
            .Distinct()
            .ToListAsync();

        var masterServices = await _db.MasterServices
            .Include(ms => ms.Service)
            .Where(ms => masterIds.Contains(ms.MasterId) && ms.IsActive)
            .ToListAsync();

        return masterServices.Select(ms => new MasterServiceDto(
            ms.Id, ms.MasterId, ms.ServiceId, ms.Service.Name, ms.Price, ms.DurationMinutes, ms.IsActive
        )).ToList();
    }

    private static SalonDto MapToDto(Salon s) => new(
        s.Id, s.Name, s.Address, s.GoogleMapsUrl, s.YandexMapsUrl,
        s.WorkingHoursStart.ToString("HH:mm"),
        s.WorkingHoursEnd.ToString("HH:mm"),
        s.WorkingDays.Select(d => d.ToString()).ToList(),
        s.Photos, s.Videos, s.IsActive, s.CreatedAt);
}
