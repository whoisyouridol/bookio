using BeautySalonBooking.Infrastructure.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.Persistence.Seed;

public static class DataSeeder
{
    /// <summary>
    /// Run on every startup: seeds SuperAdmins from config and back-fills master UserId links.
    /// Demo data seeding has been removed — use POST /api/dev/seed for test data.
    /// </summary>
    public static async Task SeedSuperAdminsAndLinkMastersAsync(
        AppDbContext context,
        UserManager<AppUser> userManager,
        IConfiguration configuration,
        ILogger logger)
    {
        await SeedSuperAdminsAsync(userManager, configuration, logger);
        await LinkExistingMasterUsersAsync(context, logger);
    }

    private static async Task SeedSuperAdminsAsync(
        UserManager<AppUser> userManager,
        IConfiguration configuration,
        ILogger logger)
    {
        var admins = configuration.GetSection("SuperAdmins").Get<List<SuperAdminSeedEntry>>();
        if (admins == null || admins.Count == 0) return;

        foreach (var entry in admins)
        {
            var existing = await userManager.FindByEmailAsync(entry.Email);
            if (existing != null)
            {
                // Ensure existing SuperAdmins are always active
                if (!existing.IsActive)
                {
                    existing.IsActive = true;
                    await userManager.UpdateAsync(existing);
                    logger.LogInformation("SuperAdmin activated: {Email}", entry.Email);
                }
                continue;
            }

            var user = new AppUser
            {
                UserName = $"user_{Guid.NewGuid()}",
                Email = entry.Email,
                EmailConfirmed = true,
                FirstName = entry.FirstName ?? "Super",
                LastName = entry.LastName ?? "Admin",
                Role = Domain.Enums.AppRole.SuperAdmin,
                IsActive = true,
            };

            var result = await userManager.CreateAsync(user, entry.Password);
            if (result.Succeeded)
                logger.LogInformation("SuperAdmin seeded: {Email}", entry.Email);
            else
                logger.LogWarning("Failed to seed SuperAdmin {Email}: {Errors}",
                    entry.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }

    /// <summary>
    /// Back-fills Master.UserId for any existing master records that don't have one yet
    /// (handles DB that existed before the UserId column was added).
    /// </summary>
    private static async Task LinkExistingMasterUsersAsync(AppDbContext context, ILogger logger)
    {
        var unlinked = await context.Masters
            .Where(m => m.UserId == null)
            .ToListAsync();

        if (unlinked.Count == 0) return;

        var users = await context.Set<AppUser>()
            .Where(u => u.MasterId != null)
            .Select(u => new { u.Id, u.MasterId })
            .ToListAsync();

        var userByMaster = users.ToDictionary(u => u.MasterId!.Value, u => u.Id);

        foreach (var master in unlinked)
        {
            if (userByMaster.TryGetValue(master.Id, out var userId))
                master.UserId = userId;
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Back-filled UserId for {Count} master(s).", unlinked.Count);
    }

    private class SuperAdminSeedEntry
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}
