using System.Text.Json;

namespace Bookio.Infrastructure.Resources;

/// <summary>
/// Loads and provides typed access to email-messages.json.
/// Singleton-safe: file is read once at startup.
/// </summary>
public class EmailMessages
{
    private readonly JsonElement _root;

    public EmailMessages()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Resources", "email-messages.json");
        var json = File.ReadAllText(path);
        _root = JsonDocument.Parse(json).RootElement;
    }

    /// <summary>Get a top-level string field from a message key, e.g. Get("bookingConfirmed", "subject")</summary>
    public string Get(string messageKey, string field)
    {
        if (_root.TryGetProperty(messageKey, out var msg) &&
            msg.TryGetProperty(field, out var val))
            return val.GetString() ?? string.Empty;

        throw new KeyNotFoundException($"email-messages.json: '{messageKey}.{field}' not found.");
    }

    /// <summary>Get a label by key, e.g. Label("salon")</summary>
    public string Label(string key)
    {
        if (_root.TryGetProperty("labels", out var labels) &&
            labels.TryGetProperty(key, out var val))
            return val.GetString() ?? string.Empty;

        throw new KeyNotFoundException($"email-messages.json: 'labels.{key}' not found.");
    }
}
