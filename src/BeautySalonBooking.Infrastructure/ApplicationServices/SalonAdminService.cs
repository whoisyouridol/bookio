using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Entities;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class SalonAdminService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly MasterService _masterService;

    public SalonAdminService(AppDbContext db, UserManager<AppUser> userManager, MasterService masterService)
    {
        _db = db;
        _userManager = userManager;
        _masterService = masterService;
    }

    public async Task<SalonAdminDashboardDto?> GetDashboardAsync(Guid salonId)
    {
        var salon = await _db.Salons.FirstOrDefaultAsync(s => s.Id == salonId && s.IsActive);
        if (salon == null) return null;

        // Masters linked to this salon
        var salonMasterIds = await _db.SalonMasters
            .Where(sm => sm.SalonId == salonId && sm.IsActive)
            .Select(sm => sm.MasterId)
            .ToListAsync();

        // Active masters: linked to salon + not deleted + user is active
        var activeMasters = await _db.Masters
            .Where(m => salonMasterIds.Contains(m.Id) && !m.IsDeleted && m.UserId != null)
            .Join(_db.Set<AppUser>(), m => m.UserId, u => u.Id, (m, u) => u)
            .CountAsync(u => u.IsActive);

        // Pending masters: users with SalonId matching and IsActive = false and role = Master
        var pendingMastersQuery = _db.Set<AppUser>()
            .Where(u => u.SalonId == salonId && u.Role == AppRole.Master && !u.IsActive);
        var pendingMastersCount = await pendingMastersQuery.CountAsync();
        var pendingMastersList = await pendingMastersQuery
            .OrderByDescending(u => u.CreatedAt)
            .Take(10)
            .Select(u => new PendingMasterDto(u.Id, u.Email!, u.FirstName, u.LastName, u.PhoneNumber, u.ExternalProvider, u.CreatedAt))
            .ToListAsync();

        // Bookings for this salon
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var thirtyDaysAgo = today.AddDays(-30);

        var bookingsQuery = _db.Bookings.Where(b => b.SalonId == salonId);

        var bookingsToday = await bookingsQuery.CountAsync(b => b.BookingDate == today);
        var bookingsThisWeek = await bookingsQuery.CountAsync(b => b.BookingDate >= weekStart);
        var bookingsThisMonth = await bookingsQuery.CountAsync(b => b.BookingDate >= monthStart);

        // Revenue from completed bookings
        var revenueToday = await bookingsQuery
            .Where(b => b.BookingDate == today && b.Status == BookingStatus.Completed)
            .SumAsync(b => (decimal?)b.TotalPrice) ?? 0m;
        var revenueThisWeek = await bookingsQuery
            .Where(b => b.BookingDate >= weekStart && b.Status == BookingStatus.Completed)
            .SumAsync(b => (decimal?)b.TotalPrice) ?? 0m;
        var revenueThisMonth = await bookingsQuery
            .Where(b => b.BookingDate >= monthStart && b.Status == BookingStatus.Completed)
            .SumAsync(b => (decimal?)b.TotalPrice) ?? 0m;

        // Cancellation rate (last 30 days)
        var last30Bookings = await bookingsQuery.CountAsync(b => b.BookingDate >= thirtyDaysAgo);
        var last30Cancelled = await bookingsQuery.CountAsync(b =>
            b.BookingDate >= thirtyDaysAgo &&
            (b.Status == BookingStatus.CancelledByClient || b.Status == BookingStatus.CancelledByMaster));
        var cancellationRate = last30Bookings > 0 ? (double)last30Cancelled / last30Bookings * 100 : 0;

        // Average rating of salon's masters
        var avgRating = await _db.MasterRatings
            .Where(r => salonMasterIds.Contains(r.MasterId))
            .AverageAsync(r => (double?)r.Rating) ?? 0;

        return new SalonAdminDashboardDto(
            activeMasters, pendingMastersCount,
            bookingsToday, bookingsThisWeek, bookingsThisMonth,
            revenueToday, revenueThisWeek, revenueThisMonth,
            Math.Round(cancellationRate, 1), Math.Round(avgRating, 1),
            pendingMastersList);
    }

    public async Task<List<SalonAdminMasterDto>> GetMastersAsync(Guid salonId)
    {
        var salonMasters = await _db.SalonMasters
            .Where(sm => sm.SalonId == salonId && sm.IsActive)
            .Select(sm => sm.MasterId)
            .ToListAsync();

        var masters = await _db.Masters
            .Where(m => salonMasters.Contains(m.Id))
            .ToListAsync();

        var userMap = await _db.Set<AppUser>()
            .Where(u => u.MasterId != null && salonMasters.Contains(u.MasterId.Value))
            .ToDictionaryAsync(u => u.MasterId!.Value);

        var ratingMap = await _db.MasterRatings
            .Where(r => salonMasters.Contains(r.MasterId))
            .GroupBy(r => r.MasterId)
            .Select(g => new { MasterId = g.Key, Avg = g.Average(r => (double)r.Rating), Count = g.Count() })
            .ToDictionaryAsync(x => x.MasterId);

        var serviceCountMap = await _db.MasterServices
            .Where(ms => salonMasters.Contains(ms.MasterId) && ms.IsActive)
            .GroupBy(ms => ms.MasterId)
            .Select(g => new { MasterId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.MasterId);

        return masters.Select(m =>
        {
            userMap.TryGetValue(m.Id, out var user);
            ratingMap.TryGetValue(m.Id, out var rating);
            serviceCountMap.TryGetValue(m.Id, out var svcCount);
            return new SalonAdminMasterDto(
                m.Id,
                user?.Id,
                user?.Email ?? "",
                user?.FirstName,
                user?.LastName,
                user?.PhoneNumber,
                m.Photo,
                user?.IsActive ?? false,
                m.IsDeleted,
                rating?.Avg,
                rating?.Count ?? 0,
                svcCount?.Count ?? 0,
                m.CreatedAt);
        }).OrderBy(m => m.FirstName).ToList();
    }

    /// <summary>Search masters not currently linked to this salon</summary>
    public async Task<List<MasterDto>> SearchAvailableMastersAsync(Guid salonId, string query)
    {
        var linkedMasterIds = await _db.SalonMasters
            .Where(sm => sm.SalonId == salonId && sm.IsActive)
            .Select(sm => sm.MasterId)
            .ToListAsync();

        var q = query.ToLower().Trim();

        var masters = await _db.Masters
            .Where(m => !m.IsDeleted && !linkedMasterIds.Contains(m.Id))
            .ToListAsync();

        var userMap = await _db.Set<AppUser>()
            .Where(u => u.MasterId != null && !linkedMasterIds.Contains(u.MasterId.Value)
                && u.Role == AppRole.Master && u.IsActive)
            .ToDictionaryAsync(u => u.MasterId!.Value);

        return masters
            .Where(m =>
            {
                if (!userMap.TryGetValue(m.Id, out var user)) return false;
                return (user.FirstName ?? "").ToLower().Contains(q)
                    || (user.LastName ?? "").ToLower().Contains(q)
                    || (user.Email ?? "").ToLower().Contains(q)
                    || (user.PhoneNumber ?? "").Contains(q);
            })
            .Take(20)
            .Select(m =>
            {
                var user = userMap[m.Id];
                return new MasterDto(m.Id, user.Email ?? "", user.FirstName ?? "", user.LastName ?? "",
                    user.PhoneNumber, m.Photo, m.Description, m.AutoApproveBookings, m.IsDeleted, user.IsActive,
                    m.CreatedAt, null, 0);
            })
            .ToList();
    }

    /// <summary>Link an existing master to the salon</summary>
    public async Task<(bool ok, string? error)> LinkMasterToSalonAsync(Guid salonId, Guid masterId)
    {
        var salon = await _db.Salons.FirstOrDefaultAsync(s => s.Id == salonId && s.IsActive);
        if (salon == null) return (false, "Salon not found");

        var master = await _db.Masters.FirstOrDefaultAsync(m => m.Id == masterId && !m.IsDeleted);
        if (master == null) return (false, "Master not found");

        var existing = await _db.SalonMasters
            .FirstOrDefaultAsync(sm => sm.SalonId == salonId && sm.MasterId == masterId);

        if (existing != null)
        {
            if (existing.IsActive) return (false, "Master already linked to this salon");
            existing.IsActive = true;
            await _db.SaveChangesAsync();
            await EnsureWeeklySlotsAsync(existing.Id, salon);
            return (true, null);
        }

        var sm = new Domain.Entities.SalonMaster
        {
            Id = Guid.NewGuid(),
            SalonId = salonId,
            MasterId = masterId,
            IsActive = true,
        };
        _db.SalonMasters.Add(sm);
        await _db.SaveChangesAsync();
        await EnsureWeeklySlotsAsync(sm.Id, salon);
        return (true, null);
    }

    /// <summary>Create a new master and auto-link to the salon</summary>
    public async Task<(MasterDto? result, string? error)> CreateMasterForSalonAsync(Guid salonId, CreateMasterRequest req)
    {
        var salon = await _db.Salons.FirstOrDefaultAsync(s => s.Id == salonId && s.IsActive);
        if (salon == null) return (null, "Salon not found");

        // Create master + AppUser via existing MasterService
        var (master, error) = await _masterService.CreateAsync(req);
        if (error != null) return (null, error);

        // Set SalonId on the user so they belong to this salon
        AppUser? user = null;
        if (!string.IsNullOrWhiteSpace(req.Email))
            user = await _userManager.FindByEmailAsync(req.Email);
        if (user != null)
        {
            user.SalonId = salonId;
            await _userManager.UpdateAsync(user);
        }

        // Auto-link master to salon with salon's default working hours
        var linkExists = await _db.SalonMasters
            .AnyAsync(sm => sm.SalonId == salonId && sm.MasterId == master!.Id);

        if (!linkExists)
        {
            var sm = new Domain.Entities.SalonMaster
            {
                Id = Guid.NewGuid(),
                SalonId = salonId,
                MasterId = master!.Id,
                IsActive = true,
            };
            _db.SalonMasters.Add(sm);
            await _db.SaveChangesAsync();
            await EnsureWeeklySlotsAsync(sm.Id, salon);
        }

        return (master, null);
    }

    /// <summary>
    /// Auto-create MasterWeeklySlot rows from the salon's schedule
    /// if no weekly slots exist yet for this salon-master link.
    /// </summary>
    private async Task EnsureWeeklySlotsAsync(Guid salonMasterId, Domain.Entities.Salon salon)
    {
        var hasSlots = await _db.MasterWeeklySlots.AnyAsync(w => w.SalonMasterId == salonMasterId);
        if (hasSlots) return;

        var slots = salon.WorkingDays.Select(day => new Domain.Entities.MasterWeeklySlot
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

    /// <summary>Remove a master from the salon (unlink SalonMaster, does not delete the master)</summary>
    public async Task<(bool ok, string? error)> RemoveMasterFromSalonAsync(Guid salonId, Guid masterId)
    {
        var link = await _db.SalonMasters
            .FirstOrDefaultAsync(sm => sm.SalonId == salonId && sm.MasterId == masterId && sm.IsActive);

        if (link == null) return (false, "Master is not linked to this salon");

        link.IsActive = false;
        await _db.SaveChangesAsync();
        return (true, null);
    }
}
