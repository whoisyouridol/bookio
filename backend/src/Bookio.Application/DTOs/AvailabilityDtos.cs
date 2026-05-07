namespace Bookio.Application.DTOs;

// ── Weekly Schedule ──────────────────────────────────────────────────────────

public record WeeklySlotDto(
    Guid Id,
    Guid SalonMasterId,
    string DayOfWeek,
    string StartTime,
    string EndTime
);

public record SetWeeklyScheduleRequest(
    List<WeeklySlotItemRequest> Slots
);

public record WeeklySlotItemRequest(
    string DayOfWeek,
    string StartTime,
    string EndTime
);

// ── Date Overrides ───────────────────────────────────────────────────────────

public record DateOverrideDto(
    Guid Id,
    Guid SalonMasterId,
    string Date,
    bool IsDayOff,
    List<DateOverrideSlotDto> Slots
);

public record DateOverrideSlotDto(
    Guid Id,
    string StartTime,
    string EndTime
);

public record UpsertDateOverrideRequest(
    string Date,
    bool IsDayOff,
    List<DateOverrideSlotItemRequest>? Slots
);

public record DateOverrideSlotItemRequest(
    string StartTime,
    string EndTime
);

// ── Time Off ─────────────────────────────────────────────────────────────────

public record TimeOffDto(
    Guid Id,
    Guid SalonMasterId,
    string StartDate,
    string EndDate,
    string? Reason
);

public record CreateTimeOffRequest(
    string StartDate,
    string EndDate,
    string? Reason
);

public record UpdateTimeOffRequest(
    string StartDate,
    string EndDate,
    string? Reason
);

// ── Resolved Availability ────────────────────────────────────────────────────

public record ResolvedDayAvailability(
    string Date,
    string Source,  // "weekly", "override", "off", "timeoff"
    List<TimeWindow> Windows
);

public record TimeWindow(
    string StartTime,
    string EndTime
);
