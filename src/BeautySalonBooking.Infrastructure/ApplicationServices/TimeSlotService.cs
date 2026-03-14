using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class TimeSlotService
{
    private readonly AppDbContext _db;
    private readonly AvailabilityService _availability;

    public TimeSlotService(AppDbContext db, AvailabilityService availability)
    {
        _db = db;
        _availability = availability;
    }

    public async Task<(List<TimeSlotDto>? slots, string? error)> GetAvailableAsync(
        Guid salonId, Guid masterId, string dateStr, List<Guid>? serviceIds)
    {
        if (!DateOnly.TryParse(dateStr, out var date))
            return (null, "Invalid date format. Use YYYY-MM-DD");

        var sm = await _db.SalonMasters.FirstOrDefaultAsync(x => x.SalonId == salonId && x.MasterId == masterId && x.IsActive);
        if (sm == null) return (null, "Salon-master link not found");

        int totalDuration = 0;
        if (serviceIds != null && serviceIds.Count > 0)
        {
            var durations = await _db.MasterServices
                .Where(ms => ms.MasterId == masterId && serviceIds.Contains(ms.ServiceId) && ms.IsActive)
                .Select(ms => ms.DurationMinutes)
                .ToListAsync();

            if (durations.Count != serviceIds.Count)
                return (null, "One or more services not found for this master");

            totalDuration = durations.Sum();
        }

        var slots = await _db.TimeSlots
            .Where(ts => ts.SalonMasterId == sm.Id && ts.Date == date && ts.Status == TimeSlotStatus.Available)
            .OrderBy(ts => ts.StartTime)
            .ToListAsync();

        if (totalDuration == 0)
            return (slots.Select(MapToDto).ToList(), null);

        // Find slots where contiguous time >= totalDuration
        var result = new List<TimeSlot>();
        for (int i = 0; i < slots.Count; i++)
        {
            var span = slots[i].EndTime - slots[i].StartTime;
            int accumulated = (int)span.TotalMinutes;

            for (int j = i + 1; j < slots.Count && accumulated < totalDuration; j++)
            {
                if (slots[j].StartTime == slots[j - 1].EndTime)
                    accumulated += (int)(slots[j].EndTime - slots[j].StartTime).TotalMinutes;
                else
                    break;
            }

            if (accumulated >= totalDuration)
                result.Add(slots[i]);
        }

        return (result.Select(MapToDto).ToList(), null);
    }

    public async Task<(List<TimeSlotDto>? result, string? error)> CreateBatchAsync(Guid salonId, Guid masterId, CreateTimeSlotsRequest req)
    {
        var sm = await _db.SalonMasters.FirstOrDefaultAsync(x => x.SalonId == salonId && x.MasterId == masterId && x.IsActive);
        if (sm == null) return (null, "Salon-master link not found");

        if (!DateOnly.TryParse(req.Date, out var date))
            return (null, "Invalid date format");

        var created = new List<TimeSlot>();
        foreach (var slot in req.Slots)
        {
            if (!TimeOnly.TryParse(slot.StartTime, out var start) || !TimeOnly.TryParse(slot.EndTime, out var end))
                continue;

            var exists = await _db.TimeSlots.AnyAsync(ts => ts.SalonMasterId == sm.Id && ts.Date == date && ts.StartTime == start);
            if (exists) continue;

            var ts = new TimeSlot
            {
                Id = Guid.NewGuid(),
                SalonMasterId = sm.Id,
                Date = date,
                StartTime = start,
                EndTime = end,
                Status = TimeSlotStatus.Available,
            };
            _db.TimeSlots.Add(ts);
            created.Add(ts);
        }
        await _db.SaveChangesAsync();
        return (created.Select(MapToDto).ToList(), null);
    }

    public async Task<(int count, string? error)> GenerateAsync(Guid salonId, Guid masterId, GenerateSlotsRequest req)
    {
        var sm = await _db.SalonMasters.FirstOrDefaultAsync(x => x.SalonId == salonId && x.MasterId == masterId && x.IsActive);
        if (sm == null) return (0, "Salon-master link not found");

        if (!DateOnly.TryParse(req.StartDate, out var startDate) || !DateOnly.TryParse(req.EndDate, out var endDate))
            return (0, "Invalid date format");

        // Check if this master has availability rules configured
        var hasAvailabilityRules = await _db.MasterWeeklySlots.AnyAsync(w => w.SalonMasterId == sm.Id);

        int count = 0;

        if (hasAvailabilityRules)
        {
            // Use the availability resolution engine
            var (resolved, resolveError) = await _availability.ResolveAsync(salonId, masterId, req.StartDate, req.EndDate);
            if (resolveError != null) return (0, resolveError);

            foreach (var day in resolved!)
            {
                if (day.Windows.Count == 0) continue; // day off or time off

                var date = DateOnly.Parse(day.Date);
                foreach (var window in day.Windows)
                {
                    var windowStart = TimeOnly.Parse(window.StartTime);
                    var windowEnd = TimeOnly.Parse(window.EndTime);

                    var current = windowStart;
                    while (current.AddMinutes(req.SlotDurationMinutes) <= windowEnd)
                    {
                        var end = current.AddMinutes(req.SlotDurationMinutes);
                        var exists = await _db.TimeSlots.AnyAsync(ts => ts.SalonMasterId == sm.Id && ts.Date == date && ts.StartTime == current);
                        if (!exists)
                        {
                            _db.TimeSlots.Add(new TimeSlot
                            {
                                Id = Guid.NewGuid(),
                                SalonMasterId = sm.Id,
                                Date = date,
                                StartTime = current,
                                EndTime = end,
                                Status = TimeSlotStatus.Available,
                            });
                            count++;
                        }
                        current = end;
                    }
                }
            }
        }
        else
        {
            // Fallback: use legacy SalonMaster.WorkingHoursStart/End/WorkingDays
            for (var d = startDate; d <= endDate; d = d.AddDays(1))
            {
                if (!sm.WorkingDays.Contains(d.DayOfWeek)) continue;

                var current = sm.WorkingHoursStart;
                while (current.AddMinutes(req.SlotDurationMinutes) <= sm.WorkingHoursEnd)
                {
                    var end = current.AddMinutes(req.SlotDurationMinutes);
                    var exists = await _db.TimeSlots.AnyAsync(ts => ts.SalonMasterId == sm.Id && ts.Date == d && ts.StartTime == current);
                    if (!exists)
                    {
                        _db.TimeSlots.Add(new TimeSlot
                        {
                            Id = Guid.NewGuid(),
                            SalonMasterId = sm.Id,
                            Date = d,
                            StartTime = current,
                            EndTime = end,
                            Status = TimeSlotStatus.Available,
                        });
                        count++;
                    }
                    current = end;
                }
            }
        }

        await _db.SaveChangesAsync();
        return (count, null);
    }

    public async Task<(TimeSlotDto? result, string? error)> UpdateStatusAsync(Guid id, UpdateSlotStatusRequest req)
    {
        if (!Enum.TryParse<TimeSlotStatus>(req.Status, out var status))
            return (null, "Invalid status. Valid: Available, Booked, Blocked");

        var slot = await _db.TimeSlots.FindAsync(id);
        if (slot == null) return (null, "Slot not found");

        slot.Status = status;
        await _db.SaveChangesAsync();
        return (MapToDto(slot), null);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var slot = await _db.TimeSlots.FindAsync(id);
        if (slot == null) return false;
        _db.TimeSlots.Remove(slot);
        await _db.SaveChangesAsync();
        return true;
    }

    private static TimeSlotDto MapToDto(TimeSlot ts) => new(
        ts.Id, ts.SalonMasterId,
        ts.Date.ToString("yyyy-MM-dd"),
        ts.StartTime.ToString("HH:mm"),
        ts.EndTime.ToString("HH:mm"),
        ts.Status.ToString()
    );
}
