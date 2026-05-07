using Bookio.Application.DTOs;
using Bookio.Domain.Entities;
using Bookio.Infrastructure.Entities;
using Bookio.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bookio.Infrastructure.ApplicationServices;

public class SalonMasterService
{
    private readonly AppDbContext _db;

    public SalonMasterService(AppDbContext db) => _db = db;

    public async Task<(SalonMasterDto? result, string? error)> LinkAsync(Guid salonId, LinkMasterToSalonRequest req)
    {
        var salon = await _db.Salons.FirstOrDefaultAsync(s => s.Id == salonId && s.IsActive);
        if (salon == null) return (null, "Salon not found");

        var masterExists = await _db.Masters.AnyAsync(m => m.Id == req.MasterId && !m.IsDeleted);
        if (!masterExists) return (null, "Master not found");

        var existing = await _db.SalonMasters.FirstOrDefaultAsync(sm => sm.SalonId == salonId && sm.MasterId == req.MasterId);
        if (existing != null)
        {
            if (existing.IsActive) return (null, "Master already linked to this salon");
            // Re-activate
            existing.IsActive = true;
            await _db.SaveChangesAsync();
            await EnsureWeeklySlotsAsync(existing.Id, salon);
            var user = await GetMasterUserAsync(req.MasterId);
            return (MapToDto(existing, user), null);
        }

        var sm = new SalonMaster
        {
            Id = Guid.NewGuid(),
            SalonId = salonId,
            MasterId = req.MasterId,
        };
        _db.SalonMasters.Add(sm);
        await _db.SaveChangesAsync();

        await EnsureWeeklySlotsAsync(sm.Id, salon);

        var u2 = await GetMasterUserAsync(req.MasterId);
        return (MapToDto(sm, u2), null);
    }

    public async Task<bool> UnlinkAsync(Guid salonId, Guid masterId)
    {
        var sm = await _db.SalonMasters.FirstOrDefaultAsync(x => x.SalonId == salonId && x.MasterId == masterId && x.IsActive);
        if (sm == null) return false;
        sm.IsActive = false;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<SalonMasterWithSalonDto>> GetByMasterAsync(Guid masterId)
    {
        var links = await _db.SalonMasters
            .Include(sm => sm.Salon)
            .Where(sm => sm.MasterId == masterId && sm.IsActive)
            .OrderBy(sm => sm.Salon.Name)
            .ToListAsync();

        return links.Select(sm => new SalonMasterWithSalonDto(
            sm.Id, sm.SalonId, sm.MasterId, sm.Salon.Name, sm.IsActive
        )).ToList();
    }

    /// <summary>
    /// Auto-create MasterWeeklySlot rows from the salon's schedule
    /// if no weekly slots exist yet for this salon-master link.
    /// </summary>
    internal async Task EnsureWeeklySlotsAsync(Guid salonMasterId, Salon salon)
    {
        var hasSlots = await _db.MasterWeeklySlots.AnyAsync(w => w.SalonMasterId == salonMasterId);
        if (hasSlots) return;

        var slots = salon.WorkingDays.Select(day => new MasterWeeklySlot
        {
            Id = Guid.NewGuid(),
            SalonMasterId = salonMasterId,
            DayOfWeek = day,
            StartTime = salon.WorkingHoursStart,
            EndTime = salon.WorkingHoursEnd,
        }).ToList();

        _db.MasterWeeklySlots.AddRange(slots);
        await _db.SaveChangesAsync();
    }

    private async Task<AppUser?> GetMasterUserAsync(Guid masterId) =>
        await _db.Set<AppUser>().FirstOrDefaultAsync(u => u.MasterId == masterId);

    private static SalonMasterDto MapToDto(SalonMaster sm, AppUser? user) => new(
        sm.Id, sm.SalonId, sm.MasterId,
        user?.FirstName ?? string.Empty,
        user?.LastName ?? string.Empty,
        sm.IsActive
    );
}
