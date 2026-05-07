namespace Bookio.Infrastructure.Helpers;

public static class PhoneNormalizer
{
    /// <summary>
    /// Strips +, spaces, dashes, parentheses → digits-only string.
    /// Returns null if input is null/empty/whitespace or has no digits.
    /// </summary>
    public static string? Normalize(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        return digits.Length >= 7 ? digits : null;
    }
}
