using System.Text.Json;

namespace BeautySalonBooking.Infrastructure.Resources;

/// <summary>
/// Loads and provides typed access to sms-messages.json.
/// Singleton-safe: file is read once at startup.
/// Georgian Unicode SMS = 70 chars per segment; templates target 1 segment.
/// </summary>
public class SmsMessages
{
    private readonly JsonElement _root;

    public const int MaxSingleSegment = 70;
    public const int MaxTwoSegments = 140;

    public SmsMessages()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Resources", "sms-messages.json");
        var json = File.ReadAllText(path);
        _root = JsonDocument.Parse(json).RootElement;
    }

    /// <summary>Get a raw template, e.g. Get("bookingConfirmed", "toClient")</summary>
    public string Get(string messageKey, string recipientType)
    {
        if (_root.TryGetProperty(messageKey, out var msg) &&
            msg.TryGetProperty(recipientType, out var val))
            return val.GetString() ?? string.Empty;

        throw new KeyNotFoundException($"sms-messages.json: '{messageKey}.{recipientType}' not found.");
    }

    /// <summary>Resolve placeholders and truncate to fit SMS segment limits.</summary>
    public string Format(string messageKey, string recipientType, Dictionary<string, string> placeholders)
    {
        var template = Get(messageKey, recipientType);
        foreach (var (key, value) in placeholders)
            template = template.Replace($"{{{key}}}", value);

        return Truncate(template, MaxTwoSegments);
    }

    /// <summary>Truncate to maxLength, appending "…" if truncated.</summary>
    public static string Truncate(string text, int maxLength)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
            return text;

        return string.Concat(text.AsSpan(0, maxLength - 1), "…");
    }
}
