using Bookio.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Bookio.Tests.Unit.Helpers;

public static class InMemoryDbHelper
{
    public record Ctx(AppDbContext Db);

    /// <summary>Returns a fresh in-memory AppDbContext.</summary>
    public static AppDbContext Create(string? name = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new AppDbContext(options);
    }

    /// <summary>Returns a Ctx wrapper (useful when the DbContext is needed both for setup and assertions).</summary>
    public static Ctx CreateCtx(string? name = null) => new(Create(name));
}
