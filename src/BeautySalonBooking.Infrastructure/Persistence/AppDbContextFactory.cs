using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BeautySalonBooking.Infrastructure.Persistence;

/// <summary>
/// Used only by EF Core design-time tools (dotnet ef migrations).
/// Not used at runtime.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        // Design-time connection string — only used for migration scaffolding
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5433;Database=BeautySalonBooking;Username=postgres;Password=postgres");
        return new AppDbContext(optionsBuilder.Options);
    }
}
