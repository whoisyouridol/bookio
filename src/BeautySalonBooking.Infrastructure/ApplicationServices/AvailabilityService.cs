using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Domain.Services;
using BeautySalonBooking.Infrastructure.Observability;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using static BeautySalonBooking.Domain.Services.AvailabilityEngine;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class AvailabilityService
{
    private readonly AppDbContext _db;
    private readonly int _tzOffsetHours;

    public AvailabilityService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _tzOffsetHours = config.GetValue<int>("Booking:TimezoneOffsetHours", 0);
    }

    private DateTime LocalNow => DateTime.UtcNow.AddHours(_tzOffsetHours);

    // ── On-the-fly slot computation ──────────────────────────────────────────

    /// <summary>
    /// Compute available slots for a specific date, on the fly.
    /// No pre-generated slots required.
    /// </summary>
    public async Task<(List<TimeSlotDto>? slots, string? error)> GetAvailableSlotsAsync(
        Guid salonId, Guid masterId, string dateStr, List<Guid>? serviceIds)
    {
        if (!DateOnly.TryParse(dateStr, out var date))
            return (null, "Invalid date format. Use YYYY-MM-DD");

        var salon = await _db.Salons.FirstOrDefaultAsync(s => s.Id == salonId && s.IsActive);
        if (salon == null) return (null, "Salon not found");
        if (!salon.WorkingDays.Contains(date.DayOfWeek))
            return ([], null); // Salon closed on this day — return empty slots, not error

        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return (null, "Salon-master link not found");

        // Calculate total service duration
        int serviceDuration = 0;
        if (serviceIds != null && serviceIds.Count > 0)
        {
            var durations = await _db.MasterServices
                .Where(ms => ms.MasterId == masterId && serviceIds.Contains(ms.ServiceId) && ms.IsActive)
                .Select(ms => ms.DurationMinutes)
                .ToListAsync();

            if (durations.Count != serviceIds.Count)
                return (null, "One or more services not found for this master");

            serviceDuration = durations.Sum();
        }

        // Build day schedule input
        var dayInput = await BuildDayScheduleAsync(sm.Id, salonId, masterId, date);

        // Compute slots (15 min fixed)
        const int slotMinutes = 15;
        var slots = serviceDuration > 0
            ? ComputeBookableSlots(dayInput, slotMinutes, serviceDuration)
            : ComputeAvailableSlots(dayInput, slotMinutes);

        // Filter out slots that have already passed (using business local time)
        var localNow = LocalNow;
        if (date == DateOnly.FromDateTime(localNow))
        {
            var nowTime = TimeOnly.FromDateTime(localNow);
            slots = slots.Where(s => s.Start > nowTime).ToList();
        }

        var dtos = slots.Select(s => new TimeSlotDto(
            Guid.Empty, // no persisted ID
            sm.Id,
            date.ToString("yyyy-MM-dd"),
            s.Start.ToString("HH:mm"),
            s.End.ToString("HH:mm"),
            "Available"
        )).ToList();

        return (dtos, null);
    }

    /// <summary>
    /// Validate that a specific time range is available for booking.
    /// Used by BookingService to validate before creating a booking.
    /// </summary>
    public async Task<(bool available, string? error)> ValidateBookingSlotAsync(
        Guid salonId, Guid masterId, DateOnly date, TimeOnly startTime, TimeOnly endTime)
    {
        using var activity = Telemetry.Source.StartActivity("Availability.Validate");
        activity?.SetTag("availability.salon_id", salonId.ToString());
        activity?.SetTag("availability.master_id", masterId.ToString());
        activity?.SetTag("availability.date", date.ToString());
        activity?.SetTag("availability.start", startTime.ToString());
        activity?.SetTag("availability.end", endTime.ToString());

        var salon = await _db.Salons.FirstOrDefaultAsync(s => s.Id == salonId && s.IsActive);
        if (salon == null) return (false, "Salon not found");
        if (!salon.WorkingDays.Contains(date.DayOfWeek))
            return (false, "The salon is closed on this day");

        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return (false, "Salon-master link not found");

        var dayInput = await BuildDayScheduleAsync(sm.Id, salonId, masterId, date);
        var available = IsRangeAvailable(dayInput, startTime, endTime);

        activity?.SetTag("availability.result", available);
        return (available, available ? null : "The requested time slot is not available");
    }

    // ── Build DayScheduleInput from DB ───────────────────────────────────────

    private async Task<DayScheduleInput> BuildDayScheduleAsync(
        Guid salonMasterId, Guid salonId, Guid masterId, DateOnly date)
    {
        // Load all data in parallel-safe queries (no N+1)
        var weeklySlots = await _db.MasterWeeklySlots
            .Where(w => w.SalonMasterId == salonMasterId && w.DayOfWeek == date.DayOfWeek)
            .Select(w => new { w.StartTime, w.EndTime })
            .ToListAsync();

        var dateOverride = await _db.MasterDateOverrides
            .Include(d => d.Slots)
            .FirstOrDefaultAsync(d => d.SalonMasterId == salonMasterId && d.Date == date);

        var isTimeOff = await _db.MasterTimeOffs
            .AnyAsync(t => t.SalonMasterId == salonMasterId && t.StartDate <= date && t.EndDate >= date);

        // Load active bookings (Pending + Confirmed) for this master on this date
        var bookedRanges = await _db.Bookings
            .Where(b => b.SalonId == salonId && b.MasterId == masterId &&
                        b.BookingDate == date &&
                        (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed))
            .Select(b => new { b.StartTime, b.EndTime })
            .ToListAsync();

        var weeklyWindows = weeklySlots
            .Select(w => new TimeRange(w.StartTime, w.EndTime))
            .ToList();

        return new DayScheduleInput
        {
            Date = date,
            WeeklyWindows = weeklyWindows,
            DateOverride = dateOverride != null
                ? new DateOverrideInput
                {
                    IsDayOff = dateOverride.IsDayOff,
                    Windows = dateOverride.Slots
                        .Select(s => new TimeRange(s.StartTime, s.EndTime))
                        .ToList(),
                }
                : null,
            IsTimeOff = isTimeOff,
            BookedRanges = bookedRanges
                .Select(b => new TimeRange(b.StartTime, b.EndTime))
                .ToList(),
        };
    }

    // ── Weekly Schedule CRUD ─────────────────────────────────────────────────

    public async Task<List<WeeklySlotDto>> GetWeeklyScheduleAsync(Guid salonMasterId)
    {
        var slots = await _db.MasterWeeklySlots
            .Where(w => w.SalonMasterId == salonMasterId)
            .OrderBy(w => w.DayOfWeek).ThenBy(w => w.StartTime)
            .ToListAsync();

        return slots.Select(MapWeeklyDto).ToList();
    }

    public async Task<(List<WeeklySlotDto>? result, string? error)> SetWeeklyScheduleAsync(
        Guid salonId, Guid masterId, SetWeeklyScheduleRequest req)
    {
        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return (null, "Salon-master link not found");

        foreach (var slot in req.Slots)
        {
            if (!Enum.TryParse<DayOfWeek>(slot.DayOfWeek, true, out _))
                return (null, $"Invalid day: {slot.DayOfWeek}");
            if (!TimeOnly.TryParse(slot.StartTime, out var start) || !TimeOnly.TryParse(slot.EndTime, out var end))
                return (null, $"Invalid time format in slot {slot.DayOfWeek} {slot.StartTime}-{slot.EndTime}");
            if (start >= end)
                return (null, $"Start time must be before end time: {slot.DayOfWeek} {slot.StartTime}-{slot.EndTime}");
        }

        var grouped = req.Slots.GroupBy(s => s.DayOfWeek, StringComparer.OrdinalIgnoreCase);
        foreach (var group in grouped)
        {
            var sorted = group
                .Select(s => (Start: TimeOnly.Parse(s.StartTime), End: TimeOnly.Parse(s.EndTime)))
                .OrderBy(s => s.Start)
                .ToList();
            for (int i = 1; i < sorted.Count; i++)
            {
                if (sorted[i].Start < sorted[i - 1].End)
                    return (null, $"Overlapping time windows on {group.Key}");
            }
        }

        var existing = await _db.MasterWeeklySlots.Where(w => w.SalonMasterId == sm.Id).ToListAsync();
        _db.MasterWeeklySlots.RemoveRange(existing);

        var newSlots = req.Slots.Select(s => new MasterWeeklySlot
        {
            Id = Guid.NewGuid(),
            SalonMasterId = sm.Id,
            DayOfWeek = Enum.Parse<DayOfWeek>(s.DayOfWeek, true),
            StartTime = TimeOnly.Parse(s.StartTime),
            EndTime = TimeOnly.Parse(s.EndTime),
        }).ToList();

        _db.MasterWeeklySlots.AddRange(newSlots);
        await _db.SaveChangesAsync();

        return (newSlots.Select(MapWeeklyDto).ToList(), null);
    }

    // ── Date Overrides CRUD ──────────────────────────────────────────────────

    public async Task<List<DateOverrideDto>> GetDateOverridesAsync(Guid salonMasterId, string? fromDate, string? toDate)
    {
        var query = _db.MasterDateOverrides
            .Include(d => d.Slots)
            .Where(d => d.SalonMasterId == salonMasterId);

        if (DateOnly.TryParse(fromDate, out var from))
            query = query.Where(d => d.Date >= from);
        if (DateOnly.TryParse(toDate, out var to))
            query = query.Where(d => d.Date <= to);

        var overrides = await query.OrderBy(d => d.Date).ToListAsync();
        return overrides.Select(MapOverrideDto).ToList();
    }

    public async Task<(DateOverrideDto? result, string? error)> UpsertDateOverrideAsync(
        Guid salonId, Guid masterId, UpsertDateOverrideRequest req)
    {
        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return (null, "Salon-master link not found");

        if (!DateOnly.TryParse(req.Date, out var date))
            return (null, "Invalid date format. Use YYYY-MM-DD");

        if (!req.IsDayOff && (req.Slots == null || req.Slots.Count == 0))
            return (null, "Non-day-off overrides must include at least one time slot");

        if (req.Slots != null)
        {
            foreach (var slot in req.Slots)
            {
                if (!TimeOnly.TryParse(slot.StartTime, out var start) || !TimeOnly.TryParse(slot.EndTime, out var end))
                    return (null, $"Invalid time format: {slot.StartTime}-{slot.EndTime}");
                if (start >= end)
                    return (null, $"Start must be before end: {slot.StartTime}-{slot.EndTime}");
            }

            var sorted = req.Slots
                .Select(s => (Start: TimeOnly.Parse(s.StartTime), End: TimeOnly.Parse(s.EndTime)))
                .OrderBy(s => s.Start)
                .ToList();
            for (int i = 1; i < sorted.Count; i++)
            {
                if (sorted[i].Start < sorted[i - 1].End)
                    return (null, "Overlapping time slots in override");
            }
        }

        var existing = await _db.MasterDateOverrides
            .Include(d => d.Slots)
            .FirstOrDefaultAsync(d => d.SalonMasterId == sm.Id && d.Date == date);

        if (existing != null)
        {
            existing.IsDayOff = req.IsDayOff;
            _db.MasterDateOverrideSlots.RemoveRange(existing.Slots);
            existing.Slots.Clear();
        }
        else
        {
            existing = new MasterDateOverride
            {
                Id = Guid.NewGuid(),
                SalonMasterId = sm.Id,
                Date = date,
                IsDayOff = req.IsDayOff,
            };
            _db.MasterDateOverrides.Add(existing);
        }

        if (!req.IsDayOff && req.Slots != null)
        {
            foreach (var s in req.Slots)
            {
                existing.Slots.Add(new MasterDateOverrideSlot
                {
                    Id = Guid.NewGuid(),
                    DateOverrideId = existing.Id,
                    StartTime = TimeOnly.Parse(s.StartTime),
                    EndTime = TimeOnly.Parse(s.EndTime),
                });
            }
        }

        await _db.SaveChangesAsync();
        return (MapOverrideDto(existing), null);
    }

    public async Task<bool> DeleteDateOverrideAsync(Guid salonId, Guid masterId, Guid overrideId)
    {
        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return false;

        var ov = await _db.MasterDateOverrides
            .FirstOrDefaultAsync(d => d.Id == overrideId && d.SalonMasterId == sm.Id);
        if (ov == null) return false;

        _db.MasterDateOverrides.Remove(ov);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Time Off CRUD ────────────────────────────────────────────────────────

    public async Task<List<TimeOffDto>> GetTimeOffsAsync(Guid salonMasterId)
    {
        var items = await _db.MasterTimeOffs
            .Where(t => t.SalonMasterId == salonMasterId)
            .OrderBy(t => t.StartDate)
            .ToListAsync();

        return items.Select(MapTimeOffDto).ToList();
    }

    public async Task<(TimeOffDto? result, string? error)> CreateTimeOffAsync(
        Guid salonId, Guid masterId, CreateTimeOffRequest req)
    {
        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return (null, "Salon-master link not found");

        if (!DateOnly.TryParse(req.StartDate, out var start) || !DateOnly.TryParse(req.EndDate, out var end))
            return (null, "Invalid date format. Use YYYY-MM-DD");

        if (start > end)
            return (null, "Start date must be before or equal to end date");

        var overlapping = await _db.MasterTimeOffs
            .AnyAsync(t => t.SalonMasterId == sm.Id && t.StartDate <= end && t.EndDate >= start);
        if (overlapping)
            return (null, "Time off overlaps with an existing entry");

        var timeOff = new MasterTimeOff
        {
            Id = Guid.NewGuid(),
            SalonMasterId = sm.Id,
            StartDate = start,
            EndDate = end,
            Reason = req.Reason,
        };

        _db.MasterTimeOffs.Add(timeOff);
        await _db.SaveChangesAsync();
        return (MapTimeOffDto(timeOff), null);
    }

    public async Task<(TimeOffDto? result, string? error)> UpdateTimeOffAsync(
        Guid salonId, Guid masterId, Guid timeOffId, UpdateTimeOffRequest req)
    {
        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return (null, "Salon-master link not found");

        var timeOff = await _db.MasterTimeOffs
            .FirstOrDefaultAsync(t => t.Id == timeOffId && t.SalonMasterId == sm.Id);
        if (timeOff == null) return (null, "Time off not found");

        if (!DateOnly.TryParse(req.StartDate, out var start) || !DateOnly.TryParse(req.EndDate, out var end))
            return (null, "Invalid date format. Use YYYY-MM-DD");

        if (start > end)
            return (null, "Start date must be before or equal to end date");

        var overlapping = await _db.MasterTimeOffs
            .AnyAsync(t => t.SalonMasterId == sm.Id && t.Id != timeOffId && t.StartDate <= end && t.EndDate >= start);
        if (overlapping)
            return (null, "Time off overlaps with an existing entry");

        timeOff.StartDate = start;
        timeOff.EndDate = end;
        timeOff.Reason = req.Reason;

        await _db.SaveChangesAsync();
        return (MapTimeOffDto(timeOff), null);
    }

    public async Task<bool> DeleteTimeOffAsync(Guid salonId, Guid masterId, Guid timeOffId)
    {
        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return false;

        var timeOff = await _db.MasterTimeOffs
            .FirstOrDefaultAsync(t => t.Id == timeOffId && t.SalonMasterId == sm.Id);
        if (timeOff == null) return false;

        _db.MasterTimeOffs.Remove(timeOff);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Resolved Availability (multi-day view for UI) ────────────────────────

    public async Task<(List<ResolvedDayAvailability>? result, string? error)> ResolveAsync(
        Guid salonId, Guid masterId, string startDateStr, string endDateStr)
    {
        var sm = await FindSalonMaster(salonId, masterId);
        if (sm == null) return (null, "Salon-master link not found");

        if (!DateOnly.TryParse(startDateStr, out var startDate) || !DateOnly.TryParse(endDateStr, out var endDate))
            return (null, "Invalid date format. Use YYYY-MM-DD");

        if (startDate > endDate)
            return (null, "Start date must be before or equal to end date");

        // Batch-load all data for the entire range (no N+1)
        var weeklySlots = await _db.MasterWeeklySlots
            .Where(w => w.SalonMasterId == sm.Id)
            .ToListAsync();

        var dateOverrides = await _db.MasterDateOverrides
            .Include(d => d.Slots)
            .Where(d => d.SalonMasterId == sm.Id && d.Date >= startDate && d.Date <= endDate)
            .ToListAsync();

        var timeOffs = await _db.MasterTimeOffs
            .Where(t => t.SalonMasterId == sm.Id && t.StartDate <= endDate && t.EndDate >= startDate)
            .ToListAsync();

        var result = new List<ResolvedDayAvailability>();

        for (var d = startDate; d <= endDate; d = d.AddDays(1))
        {
            var isTimeOff = timeOffs.Any(t => t.StartDate <= d && t.EndDate >= d);
            if (isTimeOff)
            {
                result.Add(new ResolvedDayAvailability(d.ToString("yyyy-MM-dd"), "timeoff", []));
                continue;
            }

            var dateOverride = dateOverrides.FirstOrDefault(o => o.Date == d);
            if (dateOverride != null)
            {
                if (dateOverride.IsDayOff)
                {
                    result.Add(new ResolvedDayAvailability(d.ToString("yyyy-MM-dd"), "off", []));
                }
                else
                {
                    var windows = dateOverride.Slots
                        .OrderBy(s => s.StartTime)
                        .Select(s => new TimeWindow(s.StartTime.ToString("HH:mm"), s.EndTime.ToString("HH:mm")))
                        .ToList();
                    result.Add(new ResolvedDayAvailability(d.ToString("yyyy-MM-dd"), "override", windows));
                }
                continue;
            }

            var daySlots = weeklySlots
                .Where(w => w.DayOfWeek == d.DayOfWeek)
                .OrderBy(w => w.StartTime)
                .ToList();

            if (daySlots.Count > 0)
            {
                var windows = daySlots
                    .Select(w => new TimeWindow(w.StartTime.ToString("HH:mm"), w.EndTime.ToString("HH:mm")))
                    .ToList();
                result.Add(new ResolvedDayAvailability(d.ToString("yyyy-MM-dd"), "weekly", windows));
            }
            // No weekly slots for this day → master doesn't work this day
        }

        return (result, null);
    }

    // ── Public helpers ───────────────────────────────────────────────────────

    public async Task<Guid?> FindSalonMasterIdAsync(Guid salonId, Guid masterId)
    {
        return await _db.SalonMasters
            .Where(x => x.SalonId == salonId && x.MasterId == masterId && x.IsActive)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync();
    }

    private async Task<SalonMaster?> FindSalonMaster(Guid salonId, Guid masterId)
    {
        return await _db.SalonMasters
            .FirstOrDefaultAsync(x => x.SalonId == salonId && x.MasterId == masterId && x.IsActive);
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────

    private static WeeklySlotDto MapWeeklyDto(MasterWeeklySlot w) => new(
        w.Id, w.SalonMasterId,
        w.DayOfWeek.ToString(),
        w.StartTime.ToString("HH:mm"),
        w.EndTime.ToString("HH:mm"));

    private static DateOverrideDto MapOverrideDto(MasterDateOverride d) => new(
        d.Id, d.SalonMasterId,
        d.Date.ToString("yyyy-MM-dd"),
        d.IsDayOff,
        d.Slots.OrderBy(s => s.StartTime).Select(s => new DateOverrideSlotDto(
            s.Id, s.StartTime.ToString("HH:mm"), s.EndTime.ToString("HH:mm"))).ToList());

    private static TimeOffDto MapTimeOffDto(MasterTimeOff t) => new(
        t.Id, t.SalonMasterId,
        t.StartDate.ToString("yyyy-MM-dd"),
        t.EndDate.ToString("yyyy-MM-dd"),
        t.Reason);
}
