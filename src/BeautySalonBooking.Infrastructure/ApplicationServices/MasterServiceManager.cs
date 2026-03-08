using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class MasterServiceManager
{
    private readonly AppDbContext _db;

    public MasterServiceManager(AppDbContext db) => _db = db;

    public async Task<(MasterServiceDto? result, string? error)> AddAsync(Guid masterId, AddMasterServiceRequest req)
    {
        var masterExists = await _db.Masters.AnyAsync(m => m.Id == masterId && m.IsActive);
        if (!masterExists) return (null, "Master not found");

        var serviceExists = await _db.Services.AnyAsync(s => s.Id == req.ServiceId);
        if (!serviceExists) return (null, "Service not found");

        var existing = await _db.MasterServices.FirstOrDefaultAsync(ms => ms.MasterId == masterId && ms.ServiceId == req.ServiceId);
        if (existing != null)
        {
            if (existing.IsActive) return (null, "Service already added to master");
            existing.IsActive = true;
            existing.Price = req.Price;
            existing.DurationMinutes = req.DurationMinutes;
            await _db.SaveChangesAsync();
            var existingSvc = (await _db.Services.FindAsync(req.ServiceId))!;
            return (new MasterServiceDto(existing.Id, existing.MasterId, existing.ServiceId, existingSvc.Name, existingSvc.Photo, existing.Price, existing.DurationMinutes, existing.IsActive), null);
        }

        var ms = new Domain.Entities.MasterService
        {
            Id = Guid.NewGuid(),
            MasterId = masterId,
            ServiceId = req.ServiceId,
            Price = req.Price,
            DurationMinutes = req.DurationMinutes,
        };
        _db.MasterServices.Add(ms);
        await _db.SaveChangesAsync();

        var svc = await _db.Services.FindAsync(req.ServiceId);
        return (new MasterServiceDto(ms.Id, ms.MasterId, ms.ServiceId, svc!.Name, svc.Photo, ms.Price, ms.DurationMinutes, ms.IsActive), null);
    }

    public async Task<(MasterServiceDto? result, string? error)> UpdateAsync(Guid masterId, Guid serviceId, UpdateMasterServiceRequest req)
    {
        var ms = await _db.MasterServices
            .Include(x => x.Service)
            .FirstOrDefaultAsync(x => x.MasterId == masterId && x.ServiceId == serviceId && x.IsActive);

        if (ms == null) return (null, "Master service not found");

        ms.Price = req.Price;
        ms.DurationMinutes = req.DurationMinutes;
        await _db.SaveChangesAsync();

        return (new MasterServiceDto(ms.Id, ms.MasterId, ms.ServiceId, ms.Service.Name, ms.Service.Photo, ms.Price, ms.DurationMinutes, ms.IsActive), null);
    }

    public async Task<bool> RemoveAsync(Guid masterId, Guid serviceId)
    {
        var ms = await _db.MasterServices.FirstOrDefaultAsync(x => x.MasterId == masterId && x.ServiceId == serviceId && x.IsActive);
        if (ms == null) return false;
        ms.IsActive = false;
        await _db.SaveChangesAsync();
        return true;
    }
}
