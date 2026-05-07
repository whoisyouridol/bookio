using Bookio.Infrastructure.Resources;
using FluentAssertions;

namespace Bookio.Tests.Unit;

public class SmsMessagesTests
{
    private readonly SmsMessages _sms = new();

    [Fact]
    public void Get_ValidKey_ReturnsTemplate()
    {
        var result = _sms.Get("bookingConfirmed", "toClient");
        result.Should().Contain("{salonName}");
    }

    [Fact]
    public void Get_InvalidKey_ThrowsKeyNotFound()
    {
        var act = () => _sms.Get("nonExistent", "toClient");
        act.Should().Throw<KeyNotFoundException>();
    }

    [Fact]
    public void Format_ReplacesPlaceholders()
    {
        var placeholders = new Dictionary<string, string>
        {
            ["salonName"] = "TestSalon",
            ["date"] = "05.04.2026",
            ["time"] = "14:00"
        };

        var result = _sms.Format("bookingConfirmed", "toClient", placeholders);

        result.Should().Contain("TestSalon");
        result.Should().Contain("14:00");
        result.Should().NotContain("{salonName}");
        result.Should().NotContain("{time}");
    }

    [Fact]
    public void Truncate_ShortText_ReturnsUnchanged()
    {
        var text = "Hello";
        SmsMessages.Truncate(text, 70).Should().Be("Hello");
    }

    [Fact]
    public void Truncate_ExactLength_ReturnsUnchanged()
    {
        var text = new string('a', 70);
        SmsMessages.Truncate(text, 70).Should().Be(text);
    }

    [Fact]
    public void Truncate_TooLong_TruncatesWithEllipsis()
    {
        var text = new string('a', 150);
        var result = SmsMessages.Truncate(text, 140);

        result.Length.Should().Be(140);
        result.Should().EndWith("…");
    }

    [Fact]
    public void Truncate_EmptyString_ReturnsEmpty()
    {
        SmsMessages.Truncate("", 70).Should().BeEmpty();
    }

    [Fact]
    public void Truncate_Null_ReturnsNull()
    {
        SmsMessages.Truncate(null!, 70).Should().BeNull();
    }

    [Theory]
    [InlineData("bookingConfirmed", "toClient")]
    [InlineData("bookingCancelledByMaster", "toClient")]
    [InlineData("bookingCompleted", "toClient")]
    [InlineData("reminder24h", "toClient")]
    [InlineData("reminder3h", "toClient")]
    [InlineData("bookingPendingApproval", "toMaster")]
    [InlineData("bookingCancelledByClient", "toMaster")]
    public void AllTemplates_ExistAndAreNonEmpty(string key, string recipientType)
    {
        var template = _sms.Get(key, recipientType);
        template.Should().NotBeNullOrWhiteSpace();
    }

    [Theory]
    [InlineData("reminder24h", "toClient")]
    [InlineData("reminder3h", "toClient")]
    [InlineData("bookingCompleted", "toClient")]
    public void ReminderTemplates_FitSingleSmsSegment(string key, string recipientType)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["salonName"] = "Salon Name",
            ["date"] = "05.04.2026",
            ["time"] = "14:00"
        };

        var result = _sms.Format(key, recipientType, placeholders);
        result.Length.Should().BeLessOrEqualTo(SmsMessages.MaxSingleSegment,
            $"Template '{key}.{recipientType}' resolved to {result.Length} chars, exceeding single segment limit of {SmsMessages.MaxSingleSegment}");
    }
}
