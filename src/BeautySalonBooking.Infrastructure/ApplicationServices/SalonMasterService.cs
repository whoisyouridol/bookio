using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class SalonMasterService
{
    private readonly AppDbContext _db;

    public SalonMasterService(AppDbContext db) => _db = db;

    public async Task<(SalonMasterDto? result, string? error)> LinkAsync(Guid salonId, LinkMasterToSalonRequest req)
    {
        var salonExists = await _db.Salons.AnyAsync(s => s.Id == salonId && s.IsActive);
        if (!salonExists) return (null, "Salon not found");

        var masterExists = await _db.Masters.AnyAsync(m => m.Id == req.MasterId && m.IsActive);
        if (!masterExists) return (null, "Master not found");

        var existing = await _db.SalonMasters.FirstOrDefaultAsync(sm => sm.SalonId == salonId && sm.MasterId == req.MasterId);
        if (existing != null)
        {
            if (existing.IsActive) return (null, "Master already linked to this salon");
            // Re-activate
            existing.IsActive = true;
            existing.WorkingHoursStart = TimeOnly.Parse(req.WorkingHoursStart);
            existing.WorkingHoursEnd = TimeOnly.Parse(req.WorkingHoursEnd);
            existing.WorkingDays = req.WorkingDays.Select(Enum.Parse<DayOfWeek>).ToList();
            await _db.SaveChangesAsync();
            var master = await _db.Masters.FindAsync(req.MasterId);
            return (MapToDto(existing, master!), null);
        }

        var sm = new SalonMaster
        {
            Id = Guid.NewGuid(),
            SalonId = salonId,
            MasterId = req.MasterId,
            WorkingHoursStart = TimeOnly.Parse(req.WorkingHoursStart),
            WorkingHoursEnd = TimeOnly.Parse(req.WorkingHoursEnd),
            WorkingDays = req.WorkingDays.Select(Enum.Parse<DayOfWeek>).ToList(),
        };
        _db.SalonMasters.Add(sm);
        await _db.SaveChangesAsync();

        var m2 = await _db.Masters.FindAsync(req.MasterId);
        return (MapToDto(sm, m2!), null);
    }

    public async Task<(SalonMasterDto? result, string? error)> UpdateAsync(Guid salonId, Guid masterId, UpdateSalonMasterRequest req)
    {
        var sm = await _db.SalonMasters
            .Include(x => x.Master)
            .FirstOrDefaultAsync(x => x.SalonId == salonId && x.MasterId == masterId && x.IsActive);

        if (sm == null) return (null, "Salon-master link not found");

        sm.WorkingHoursStart = TimeOnly.Parse(req.WorkingHoursStart);
        sm.WorkingHoursEnd = TimeOnly.Parse(req.WorkingHoursEnd);
        sm.WorkingDays = req.WorkingDays.Select(Enum.Parse<DayOfWeek>).ToList();
        await _db.SaveChangesAsync();

        return (MapToDto(sm, sm.Master), null);
    }

    public async Task<bool> UnlinkAsync(Guid salonId, Guid masterId)
    {
        var sm = await _db.SalonMasters.FirstOrDefaultAsync(x => x.SalonId == salonId && x.MasterId == masterId && x.IsActive);
        if (sm == null) return false;
        sm.IsActive = false;
        await _db.SaveChangesAsync();
        return true;
    }

    private static SalonMasterDto MapToDto(SalonMaster sm, Domain.Entities.Master master) => new(
        sm.Id, sm.SalonId, sm.MasterId,
        master.FirstName, master.LastName,
        sm.WorkingHoursStart.ToString("HH:mm"),
        sm.WorkingHoursEnd.ToString("HH:mm"),
        sm.WorkingDays.Select(d => d.ToString()).ToList(),
        sm.IsActive
    );
}
