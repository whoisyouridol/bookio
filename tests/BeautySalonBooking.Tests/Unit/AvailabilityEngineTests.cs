using BeautySalonBooking.Domain.Services;
using FluentAssertions;
using static BeautySalonBooking.Domain.Services.AvailabilityEngine;

namespace BeautySalonBooking.Tests.Unit;

public class AvailabilityEngineTests
{
    private static TimeRange R(string start, string end) =>
        new(TimeOnly.Parse(start), TimeOnly.Parse(end));

    // ── ResolveWorkingWindows ────────────────────────────────────────────────

    [Fact]
    public void Resolve_TimeOff_ReturnsEmpty()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "18:00")],
            IsTimeOff = true,
        };

        ResolveWorkingWindows(input).Should().BeEmpty();
    }

    [Fact]
    public void Resolve_DateOverrideDayOff_ReturnsEmpty()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "18:00")],
            DateOverride = new DateOverrideInput { IsDayOff = true },
        };

        ResolveWorkingWindows(input).Should().BeEmpty();
    }

    [Fact]
    public void Resolve_DateOverride_TakesPrecedenceOverWeekly()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "18:00")],
            DateOverride = new DateOverrideInput
            {
                IsDayOff = false,
                Windows = [R("10:00", "14:00")],
            },
        };

        var result = ResolveWorkingWindows(input);
        result.Should().HaveCount(1);
        result[0].Should().Be(R("10:00", "14:00"));
    }

    [Fact]
    public void Resolve_NoOverride_UsesWeekly()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "13:00"), R("14:00", "18:00")],
        };

        var result = ResolveWorkingWindows(input);
        result.Should().HaveCount(2);
    }

    [Fact]
    public void Resolve_NoConfig_ReturnsEmpty()
    {
        var input = new DayScheduleInput { Date = new DateOnly(2026, 3, 16) };
        ResolveWorkingWindows(input).Should().BeEmpty();
    }

    // ── SubtractRanges ───────────────────────────────────────────────────────

    [Fact]
    public void Subtract_NoExclusions_ReturnsOriginal()
    {
        var windows = new List<TimeRange> { R("09:00", "18:00") };
        var result = SubtractRanges(windows, []);
        result.Should().HaveCount(1);
        result[0].Should().Be(R("09:00", "18:00"));
    }

    [Fact]
    public void Subtract_MiddleBooking_SplitsWindow()
    {
        var windows = new List<TimeRange> { R("09:00", "18:00") };
        var exclusions = new List<TimeRange> { R("12:00", "13:00") };

        var result = SubtractRanges(windows, exclusions);

        result.Should().HaveCount(2);
        result[0].Should().Be(R("09:00", "12:00"));
        result[1].Should().Be(R("13:00", "18:00"));
    }

    [Fact]
    public void Subtract_StartBooking_TrimsStart()
    {
        var windows = new List<TimeRange> { R("09:00", "18:00") };
        var exclusions = new List<TimeRange> { R("09:00", "10:00") };

        var result = SubtractRanges(windows, exclusions);

        result.Should().HaveCount(1);
        result[0].Should().Be(R("10:00", "18:00"));
    }

    [Fact]
    public void Subtract_EndBooking_TrimsEnd()
    {
        var windows = new List<TimeRange> { R("09:00", "18:00") };
        var exclusions = new List<TimeRange> { R("17:00", "18:00") };

        var result = SubtractRanges(windows, exclusions);

        result.Should().HaveCount(1);
        result[0].Should().Be(R("09:00", "17:00"));
    }

    [Fact]
    public void Subtract_FullCoverage_ReturnsEmpty()
    {
        var windows = new List<TimeRange> { R("09:00", "18:00") };
        var exclusions = new List<TimeRange> { R("08:00", "19:00") };

        SubtractRanges(windows, exclusions).Should().BeEmpty();
    }

    [Fact]
    public void Subtract_MultipleBookings_SplitsCorrectly()
    {
        var windows = new List<TimeRange> { R("09:00", "18:00") };
        var exclusions = new List<TimeRange>
        {
            R("10:00", "11:00"),
            R("14:00", "15:00"),
        };

        var result = SubtractRanges(windows, exclusions);

        result.Should().HaveCount(3);
        result[0].Should().Be(R("09:00", "10:00"));
        result[1].Should().Be(R("11:00", "14:00"));
        result[2].Should().Be(R("15:00", "18:00"));
    }

    [Fact]
    public void Subtract_NonOverlapping_ReturnsOriginal()
    {
        var windows = new List<TimeRange> { R("09:00", "12:00") };
        var exclusions = new List<TimeRange> { R("13:00", "14:00") };

        var result = SubtractRanges(windows, exclusions);
        result.Should().HaveCount(1);
        result[0].Should().Be(R("09:00", "12:00"));
    }

    [Fact]
    public void Subtract_SplitShift_WithBooking()
    {
        var windows = new List<TimeRange> { R("09:00", "12:00"), R("14:00", "18:00") };
        var exclusions = new List<TimeRange> { R("15:00", "16:00") };

        var result = SubtractRanges(windows, exclusions);

        result.Should().HaveCount(3);
        result[0].Should().Be(R("09:00", "12:00"));
        result[1].Should().Be(R("14:00", "15:00"));
        result[2].Should().Be(R("16:00", "18:00"));
    }

    // ── SliceIntoSlots ───────────────────────────────────────────────────────

    [Fact]
    public void Slice_SimpleWindow_CorrectSlots()
    {
        var windows = new List<TimeRange> { R("09:00", "10:00") };
        var result = SliceIntoSlots(windows, 15);

        result.Should().HaveCount(4);
        result[0].Start.Should().Be(TimeOnly.Parse("09:00"));
        result[0].End.Should().Be(TimeOnly.Parse("09:15"));
        result[3].Start.Should().Be(TimeOnly.Parse("09:45"));
        result[3].End.Should().Be(TimeOnly.Parse("10:00"));
    }

    [Fact]
    public void Slice_WindowNotDivisible_DropsRemainder()
    {
        var windows = new List<TimeRange> { R("09:00", "09:40") };
        var result = SliceIntoSlots(windows, 15);

        result.Should().HaveCount(2); // 09:00-09:15, 09:15-09:30, (10 min left, too short)
    }

    [Fact]
    public void Slice_MultipleWindows_CombinesSlots()
    {
        var windows = new List<TimeRange> { R("09:00", "10:00"), R("14:00", "15:00") };
        var result = SliceIntoSlots(windows, 30);

        result.Should().HaveCount(4);
        result[0].Start.Should().Be(TimeOnly.Parse("09:00"));
        result[1].Start.Should().Be(TimeOnly.Parse("09:30"));
        result[2].Start.Should().Be(TimeOnly.Parse("14:00"));
        result[3].Start.Should().Be(TimeOnly.Parse("14:30"));
    }

    // ── ComputeAvailableSlots (end-to-end) ───────────────────────────────────

    [Fact]
    public void Compute_FullDay_WithBooking_SubtractsCorrectly()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "12:00")],
            BookedRanges = [R("10:00", "10:30")],
        };

        var result = ComputeAvailableSlots(input, 15);

        // 09:00-10:00 = 4 slots, 10:30-12:00 = 6 slots = 10 total
        result.Should().HaveCount(10);
        result.Should().NotContain(s => s.Start >= TimeOnly.Parse("10:00") && s.Start < TimeOnly.Parse("10:30"));
    }

    [Fact]
    public void Compute_TimeOff_ReturnsEmpty()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "18:00")],
            IsTimeOff = true,
        };

        ComputeAvailableSlots(input, 15).Should().BeEmpty();
    }

    [Fact]
    public void Compute_NoConfig_ReturnsEmpty()
    {
        var input = new DayScheduleInput { Date = new DateOnly(2026, 3, 16) };
        ComputeAvailableSlots(input, 15).Should().BeEmpty();
    }

    // ── ComputeBookableSlots ─────────────────────────────────────────────────

    [Fact]
    public void Bookable_RequiresContiguousSlots()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "12:00")],
            BookedRanges = [R("10:00", "10:15")], // 15-min gap at 10:00
        };

        // 45-minute service needs 3 contiguous 15-min slots
        var result = ComputeBookableSlots(input, 15, 45);

        // Before gap: 09:00-10:00 has 4 slots, so 09:00 and 09:15 can start a 45-min booking
        // After gap: 10:15-12:00 has 7 slots, so 10:15 through 11:15 can start a 45-min booking
        result.Should().Contain(s => s.Start == TimeOnly.Parse("09:00"));
        result.Should().Contain(s => s.Start == TimeOnly.Parse("09:15"));
        result.Should().NotContain(s => s.Start == TimeOnly.Parse("09:30")); // only 30 min before gap
        result.Should().NotContain(s => s.Start == TimeOnly.Parse("09:45")); // only 15 min before gap
        result.Should().Contain(s => s.Start == TimeOnly.Parse("10:15"));
    }

    [Fact]
    public void Bookable_ShortService_ReturnsAllSlots()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "10:00")],
        };

        // Service fits in single slot
        var result = ComputeBookableSlots(input, 15, 15);
        result.Should().HaveCount(4);
    }

    // ── IsRangeAvailable ─────────────────────────────────────────────────────

    [Fact]
    public void IsAvailable_FreeRange_ReturnsTrue()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "18:00")],
        };

        IsRangeAvailable(input, TimeOnly.Parse("10:00"), TimeOnly.Parse("11:00")).Should().BeTrue();
    }

    [Fact]
    public void IsAvailable_OverlapsBooking_ReturnsFalse()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "18:00")],
            BookedRanges = [R("10:00", "11:00")],
        };

        IsRangeAvailable(input, TimeOnly.Parse("10:30"), TimeOnly.Parse("11:30")).Should().BeFalse();
    }

    [Fact]
    public void IsAvailable_OutsideWorkingHours_ReturnsFalse()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "12:00")],
        };

        IsRangeAvailable(input, TimeOnly.Parse("11:00"), TimeOnly.Parse("13:00")).Should().BeFalse();
    }

    [Fact]
    public void IsAvailable_TimeOff_ReturnsFalse()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "18:00")],
            IsTimeOff = true,
        };

        IsRangeAvailable(input, TimeOnly.Parse("10:00"), TimeOnly.Parse("11:00")).Should().BeFalse();
    }

    [Fact]
    public void IsAvailable_AdjacentToBooking_ReturnsTrue()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "18:00")],
            BookedRanges = [R("10:00", "11:00")],
        };

        // Right after the booking ends
        IsRangeAvailable(input, TimeOnly.Parse("11:00"), TimeOnly.Parse("12:00")).Should().BeTrue();
        // Right before the booking starts
        IsRangeAvailable(input, TimeOnly.Parse("09:00"), TimeOnly.Parse("10:00")).Should().BeTrue();
    }

    [Fact]
    public void IsAvailable_SplitShift_SpanningGap_ReturnsFalse()
    {
        var input = new DayScheduleInput
        {
            Date = new DateOnly(2026, 3, 16),
            WeeklyWindows = [R("09:00", "12:00"), R("14:00", "18:00")],
        };

        // Spans the lunch gap
        IsRangeAvailable(input, TimeOnly.Parse("11:00"), TimeOnly.Parse("15:00")).Should().BeFalse();
    }
}
