namespace Bookio.Domain.Services;

/// <summary>
/// Pure, deterministic availability engine. No DB, no side effects.
/// Takes scheduling rules + existing bookings → returns available time slots.
/// </summary>
public static class AvailabilityEngine
{
    /// <summary>Represents a continuous time range.</summary>
    public readonly record struct TimeRange(TimeOnly Start, TimeOnly End)
    {
        public int DurationMinutes => (int)(End - Start).TotalMinutes;
        public bool Overlaps(TimeRange other) => Start < other.End && other.Start < End;
        public bool Contains(TimeOnly point) => point >= Start && point < End;
    }

    /// <summary>Input: scheduling rules for a single day.</summary>
    public sealed class DayScheduleInput
    {
        public DateOnly Date { get; init; }

        /// <summary>Weekly schedule windows for this day of week. Empty = master doesn't work this day.</summary>
        public List<TimeRange> WeeklyWindows { get; init; } = [];

        /// <summary>Date override. Null = no override for this date.</summary>
        public DateOverrideInput? DateOverride { get; init; }

        /// <summary>Whether this date falls within a time-off period.</summary>
        public bool IsTimeOff { get; init; }

        /// <summary>Existing bookings that occupy time on this date (Pending + Confirmed only).</summary>
        public List<TimeRange> BookedRanges { get; init; } = [];
    }

    public sealed class DateOverrideInput
    {
        public bool IsDayOff { get; init; }
        public List<TimeRange> Windows { get; init; } = [];
    }

    /// <summary>Output: a computed available slot that a client can book.</summary>
    public readonly record struct AvailableSlot(TimeOnly Start, TimeOnly End);

    /// <summary>
    /// Compute available booking slots for a single day.
    ///
    /// Resolution priority:
    ///   1. Time off → no availability
    ///   2. Date override → use override windows (or day off)
    ///   3. Weekly schedule → use weekly windows
    ///
    /// Then subtract booked ranges and slice into slots of the requested duration.
    /// </summary>
    public static List<AvailableSlot> ComputeAvailableSlots(
        DayScheduleInput input,
        int slotDurationMinutes)
    {
        if (slotDurationMinutes <= 0)
            throw new ArgumentException("Slot duration must be positive", nameof(slotDurationMinutes));

        // Step 1: Determine raw working windows (priority resolution)
        var workingWindows = ResolveWorkingWindows(input);
        if (workingWindows.Count == 0)
            return [];

        // Step 2: Subtract booked ranges
        var freeWindows = SubtractRanges(workingWindows, input.BookedRanges);
        if (freeWindows.Count == 0)
            return [];

        // Step 3: Slice into discrete slots
        return SliceIntoSlots(freeWindows, slotDurationMinutes);
    }

    /// <summary>
    /// Compute contiguous available slots where a booking of `serviceDurationMinutes` can start.
    /// Returns only start slots where enough contiguous free time exists.
    /// </summary>
    public static List<AvailableSlot> ComputeBookableSlots(
        DayScheduleInput input,
        int slotDurationMinutes,
        int serviceDurationMinutes)
    {
        var allSlots = ComputeAvailableSlots(input, slotDurationMinutes);
        if (serviceDurationMinutes <= 0 || serviceDurationMinutes <= slotDurationMinutes)
            return allSlots;

        var result = new List<AvailableSlot>();
        for (int i = 0; i < allSlots.Count; i++)
        {
            var accumulated = slotDurationMinutes;
            var valid = true;

            for (int j = i + 1; j < allSlots.Count && accumulated < serviceDurationMinutes; j++)
            {
                if (allSlots[j].Start == allSlots[j - 1].End)
                {
                    accumulated += slotDurationMinutes;
                }
                else
                {
                    valid = false;
                    break;
                }
            }

            if (valid && accumulated >= serviceDurationMinutes)
                result.Add(allSlots[i]);
        }

        return result;
    }

    /// <summary>
    /// Check if a specific time range is available for booking.
    /// </summary>
    public static bool IsRangeAvailable(DayScheduleInput input, TimeOnly start, TimeOnly end)
    {
        var workingWindows = ResolveWorkingWindows(input);
        if (workingWindows.Count == 0)
            return false;

        var requestedRange = new TimeRange(start, end);

        // Check that the entire requested range falls within working windows
        var covered = CoverageMinutes(workingWindows, requestedRange);
        if (covered < requestedRange.DurationMinutes)
            return false;

        // Check that no booked range overlaps
        foreach (var booked in input.BookedRanges)
        {
            if (requestedRange.Overlaps(booked))
                return false;
        }

        return true;
    }

    // ── Pure helper functions ────────────────────────────────────────────────

    /// <summary>Resolve which working windows apply for this day (priority logic).</summary>
    internal static List<TimeRange> ResolveWorkingWindows(DayScheduleInput input)
    {
        // Priority 1: Time off blocks everything
        if (input.IsTimeOff)
            return [];

        // Priority 2: Date override
        if (input.DateOverride != null)
        {
            if (input.DateOverride.IsDayOff)
                return [];
            return NormalizeAndSort(input.DateOverride.Windows);
        }

        // Priority 3: Weekly schedule
        return NormalizeAndSort(input.WeeklyWindows);
    }

    /// <summary>Subtract a set of occupied ranges from a set of free windows.</summary>
    internal static List<TimeRange> SubtractRanges(
        List<TimeRange> windows, List<TimeRange> exclusions)
    {
        if (exclusions.Count == 0)
            return windows;

        var sortedExclusions = exclusions.OrderBy(e => e.Start).ToList();
        var result = new List<TimeRange>();

        foreach (var window in windows)
        {
            var remaining = new List<TimeRange> { window };

            foreach (var excl in sortedExclusions)
            {
                var next = new List<TimeRange>();
                foreach (var r in remaining)
                {
                    if (!r.Overlaps(excl))
                    {
                        next.Add(r);
                        continue;
                    }

                    // Left fragment
                    if (r.Start < excl.Start)
                        next.Add(new TimeRange(r.Start, excl.Start));

                    // Right fragment
                    if (r.End > excl.End)
                        next.Add(new TimeRange(excl.End, r.End));
                }
                remaining = next;
            }

            result.AddRange(remaining);
        }

        return result;
    }

    /// <summary>Slice continuous time windows into fixed-duration slots.</summary>
    internal static List<AvailableSlot> SliceIntoSlots(List<TimeRange> windows, int slotMinutes)
    {
        var slots = new List<AvailableSlot>();
        foreach (var window in windows)
        {
            var current = window.Start;
            while (current.AddMinutes(slotMinutes) <= window.End)
            {
                var end = current.AddMinutes(slotMinutes);
                slots.Add(new AvailableSlot(current, end));
                current = end;
            }
        }
        return slots;
    }

    /// <summary>Sort and validate time ranges (no overlaps expected).</summary>
    private static List<TimeRange> NormalizeAndSort(List<TimeRange> ranges)
        => ranges.Where(r => r.Start < r.End).OrderBy(r => r.Start).ToList();

    /// <summary>Calculate how many minutes of `target` are covered by `windows`.</summary>
    private static int CoverageMinutes(List<TimeRange> windows, TimeRange target)
    {
        int covered = 0;
        foreach (var w in windows)
        {
            var overlapStart = target.Start > w.Start ? target.Start : w.Start;
            var overlapEnd = target.End < w.End ? target.End : w.End;
            if (overlapStart < overlapEnd)
                covered += (int)(overlapEnd - overlapStart).TotalMinutes;
        }
        return covered;
    }
}
