using System.Text.RegularExpressions;
using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Infrastructure.Entities;
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
            .FirstOrDefaultAsync(s => s.Id == id);

        if (salon == null) return null;
        return await MapToDetailDto(salon);
    }

    public async Task<SalonDetailDto?> GetBySlugAsync(string slug)
    {
        var salon = await _db.Salons
            .Include(s => s.SalonMasters.Where(sm => sm.IsActive))
            .FirstOrDefaultAsync(s => s.Slug == slug && s.IsActive);

        if (salon == null) return null;
        return await MapToDetailDto(salon);
    }

    public async Task<SalonDto> CreateAsync(CreateSalonRequest req)
    {
        var slug = !string.IsNullOrWhiteSpace(req.Slug) ? req.Slug : GenerateSlug(req.Name);
        slug = await EnsureUniqueSlug(slug, null);

        var salon = new Salon
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Slug = slug,
            Address = req.Address,
            GoogleMapsUrl = req.GoogleMapsUrl,
            YandexMapsUrl = req.YandexMapsUrl,
            WorkingHoursStart = TimeOnly.Parse(req.WorkingHoursStart),
            WorkingHoursEnd = TimeOnly.Parse(req.WorkingHoursEnd),
            WorkingDays = req.WorkingDays.Select(Enum.Parse<DayOfWeek>).ToList(),
            CoverPicture = req.CoverPicture,
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

        if (!string.IsNullOrWhiteSpace(req.Slug))
            salon.Slug = await EnsureUniqueSlug(req.Slug, id);
        else if (salon.Slug == null)
            salon.Slug = await EnsureUniqueSlug(GenerateSlug(req.Name), id);

        salon.Name = req.Name;
        salon.Address = req.Address;
        salon.GoogleMapsUrl = req.GoogleMapsUrl;
        salon.YandexMapsUrl = req.YandexMapsUrl;
        salon.WorkingHoursStart = TimeOnly.Parse(req.WorkingHoursStart);
        salon.WorkingHoursEnd = TimeOnly.Parse(req.WorkingHoursEnd);
        salon.WorkingDays = req.WorkingDays.Select(Enum.Parse<DayOfWeek>).ToList();
        salon.CoverPicture = req.CoverPicture;
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
            .Where(sm => sm.SalonId == salonId && sm.IsActive)
            .ToListAsync();

        var masterIds = sms.Select(sm => sm.MasterId).ToList();
        var userByMaster = await GetUsersByMasterIdsAsync(masterIds);

        return sms.Select(sm => new SalonMasterDto(
            sm.Id, sm.SalonId, sm.MasterId,
            userByMaster.GetValueOrDefault(sm.MasterId)?.FirstName ?? string.Empty,
            userByMaster.GetValueOrDefault(sm.MasterId)?.LastName ?? string.Empty,
            sm.IsActive
        )).ToList();
    }

    private async Task<Dictionary<Guid, AppUser>> GetUsersByMasterIdsAsync(List<Guid> masterIds) =>
        await _db.Set<AppUser>()
            .Where(u => u.MasterId != null && masterIds.Contains(u.MasterId.Value))
            .ToDictionaryAsync(u => u.MasterId!.Value);

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
            ms.Id, ms.MasterId, ms.ServiceId, ms.Service.Name, ms.Service.Photo, ms.Photo, ms.Description, ms.Price, ms.DurationMinutes, ms.IsActive
        )).ToList();
    }

    // ── Slug helpers ──────────────────────────────────────────────────────────

    internal static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant().Trim();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"[\s]+", "-");
        slug = Regex.Replace(slug, @"-{2,}", "-");
        slug = slug.Trim('-');
        return string.IsNullOrEmpty(slug) ? "salon" : slug;
    }

    private async Task<string> EnsureUniqueSlug(string slug, Guid? excludeId)
    {
        var existing = await _db.Salons
            .Where(s => s.Slug == slug && (excludeId == null || s.Id != excludeId))
            .AnyAsync();

        if (!existing) return slug;

        // Append random suffix
        for (int i = 1; i <= 100; i++)
        {
            var candidate = $"{slug}-{i}";
            if (!await _db.Salons.AnyAsync(s => s.Slug == candidate && (excludeId == null || s.Id != excludeId)))
                return candidate;
        }

        return $"{slug}-{Guid.NewGuid().ToString()[..6]}";
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static SalonDto MapToDto(Salon s) => new(
        s.Id, s.Name, s.Slug, s.Address, s.GoogleMapsUrl, s.YandexMapsUrl,
        s.WorkingHoursStart.ToString("HH:mm"),
        s.WorkingHoursEnd.ToString("HH:mm"),
        s.WorkingDays.Select(d => d.ToString()).ToList(),
        s.CoverPicture,
        s.IsActive, s.CreatedAt);

    private async Task<SalonDetailDto> MapToDetailDto(Salon salon)
    {
        var masterIds = salon.SalonMasters.Select(sm => sm.MasterId).ToList();
        var userByMaster = await GetUsersByMasterIdsAsync(masterIds);

        var masters = salon.SalonMasters.Select(sm => new SalonMasterDto(
            sm.Id, sm.SalonId, sm.MasterId,
            userByMaster.GetValueOrDefault(sm.MasterId)?.FirstName ?? string.Empty,
            userByMaster.GetValueOrDefault(sm.MasterId)?.LastName ?? string.Empty,
            sm.IsActive
        )).ToList();

        return new SalonDetailDto(
            salon.Id, salon.Name, salon.Slug, salon.Address,
            salon.GoogleMapsUrl, salon.YandexMapsUrl,
            salon.WorkingHoursStart.ToString("HH:mm"),
            salon.WorkingHoursEnd.ToString("HH:mm"),
            salon.WorkingDays.Select(d => d.ToString()).ToList(),
            salon.CoverPicture,
            salon.IsActive, salon.CreatedAt, masters);
    }
}
