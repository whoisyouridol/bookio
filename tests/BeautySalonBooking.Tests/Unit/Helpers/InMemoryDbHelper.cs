using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Tests.Unit.Helpers;

public static class InMemoryDbHelper
{
    public record Ctx(AppDbContext Db);

    /// <summary>Returns a fresh in-memory AppDbContext.</summary>
    public static AppDbContext Create(string? name = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    /// <summary>Returns a Ctx wrapper (useful when the DbContext is needed both for setup and assertions).</summary>
    public static Ctx CreateCtx(string? name = null) => new(Create(name));
}
