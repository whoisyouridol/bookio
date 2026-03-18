using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BeautySalonBooking.API.Middleware;

public class SubdomainMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string[] _mainDomains;

    public SubdomainMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _mainDomains = config.GetSection("Subdomain:MainDomains").Get<string[]>()
            ?? ["localhost", "bookvisit.com", "www.bookvisit.com"];
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db, IMemoryCache cache)
    {
        var host = context.Request.Headers["X-Forwarded-Host"].FirstOrDefault()
            ?? context.Request.Host.Host;

        // Strip port
        var colonIdx = host.IndexOf(':');
        if (colonIdx > 0) host = host[..colonIdx];

        string? subdomain = null;

        foreach (var main in _mainDomains)
        {
            if (string.Equals(host, main, StringComparison.OrdinalIgnoreCase))
            {
                // Exact match → main domain, no subdomain
                await _next(context);
                return;
            }

            if (host.EndsWith("." + main, StringComparison.OrdinalIgnoreCase))
            {
                subdomain = host[..^(main.Length + 1)];
                break;
            }
        }

        if (string.IsNullOrEmpty(subdomain) || subdomain == "www" || subdomain == "api")
        {
            await _next(context);
            return;
        }

        // Resolve salon by slug (cached for 5 minutes)
        var cacheKey = $"salon-slug:{subdomain}";
        if (!cache.TryGetValue(cacheKey, out Guid salonId))
        {
            var salon = await db.Salons
                .Where(s => s.Slug == subdomain && s.IsActive)
                .Select(s => new { s.Id })
                .FirstOrDefaultAsync();

            if (salon == null)
            {
                await _next(context);
                return;
            }

            salonId = salon.Id;
            cache.Set(cacheKey, salonId, TimeSpan.FromMinutes(5));
        }

        context.Items["SalonSlug"] = subdomain;
        context.Items["SalonId"] = salonId;

        await _next(context);
    }
}
