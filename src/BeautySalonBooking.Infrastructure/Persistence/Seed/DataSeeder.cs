using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.Persistence.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(
        AppDbContext context,
        UserManager<AppUser> userManager,
        IConfiguration configuration,
        ILogger logger)
    {
        await SeedSuperAdminsAsync(userManager, configuration, logger);

        if (await context.Salons.AnyAsync()) return;

        // --- Services ---
        var serviceIds = new
        {
            Haircut = Guid.Parse("11111111-0000-0000-0000-000000000001"),
            Coloring = Guid.Parse("11111111-0000-0000-0000-000000000002"),
            Manicure = Guid.Parse("11111111-0000-0000-0000-000000000003"),
            Pedicure = Guid.Parse("11111111-0000-0000-0000-000000000004"),
            Eyebrows = Guid.Parse("11111111-0000-0000-0000-000000000005"),
        };

        var services = new List<Domain.Entities.Service>
        {
            new() { Id = serviceIds.Haircut,  Name = "Haircut & Styling", Description = "Professional haircut with blow-dry and styling",  Photo = "https://images.unsplash.com/photo-1562322140-8b6d5c9e5f4e?w=600&h=400&fit=crop", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = serviceIds.Coloring, Name = "Hair Coloring",     Description = "Full or partial coloring, highlights, balayage",   Photo = "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=400&fit=crop", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = serviceIds.Manicure, Name = "Manicure",          Description = "Classic or gel manicure with nail art options",    Photo = "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = serviceIds.Pedicure, Name = "Pedicure",          Description = "Relaxing pedicure with scrub and polish",          Photo = "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&h=400&fit=crop", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = serviceIds.Eyebrows, Name = "Eyebrow Shaping",   Description = "Precision threading, waxing or microblading",      Photo = "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
        };

        await context.Services.AddRangeAsync(services);

        // --- Masters ---
        var masterIds = new
        {
            Anna   = Guid.Parse("22222222-0000-0000-0000-000000000001"),
            Maria  = Guid.Parse("22222222-0000-0000-0000-000000000002"),
            Olga   = Guid.Parse("22222222-0000-0000-0000-000000000003"),
        };

        var masters = new List<Master>
        {
            new() { Id = masterIds.Anna,  FirstName = "Ashley",  LastName = "Morgan",   Phone = "+14155550101", Photo = "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&face", Description = "Hair specialist with 8 years of experience based in San Francisco. Specializes in balayage, highlights and creative color transformations.", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = masterIds.Maria, FirstName = "Jessica", LastName = "Williams",  Phone = "+14155550102", Photo = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&face", Description = "Certified nail technician and beauty artist with 6 years in the industry. Expert in gel extensions, nail art and pedicure treatments.", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = masterIds.Olga,  FirstName = "Lauren",  LastName = "Davis",    Phone = "+14155550103", Photo = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&face", Description = "Versatile beauty professional with 5 years of experience across hair styling, nail care and precision brow shaping.", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
        };
        await context.Masters.AddRangeAsync(masters);

        // --- Salons ---
        var salonIds = new
        {
            Bloom  = Guid.Parse("33333333-0000-0000-0000-000000000001"),
            Charm  = Guid.Parse("33333333-0000-0000-0000-000000000002"),
        };

        var workdaysMonFri = new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
        var workdaysMonSat = new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday };

        var salons = new List<Salon>
        {
            new()
            {
                Id = salonIds.Bloom, Name = "Glow Beauty Studio", Address = "742 Market St, San Francisco, CA 94102",
                GoogleMapsUrl = "https://maps.google.com/?q=742+Market+St+San+Francisco+CA",
                WorkingHoursStart = new TimeOnly(9, 0), WorkingHoursEnd = new TimeOnly(21, 0),
                WorkingDays = workdaysMonSat,
                Photos = [
                    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop",
                    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=600&fit=crop",
                ],
                Videos = [],
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            },
            new()
            {
                Id = salonIds.Charm, Name = "Luxe Hair & Nails", Address = "1280 Lexington Ave, New York, NY 10028",
                GoogleMapsUrl = "https://maps.google.com/?q=1280+Lexington+Ave+New+York+NY",
                WorkingHoursStart = new TimeOnly(10, 0), WorkingHoursEnd = new TimeOnly(20, 0),
                WorkingDays = workdaysMonFri,
                Photos = [
                    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop",
                    "https://images.unsplash.com/photo-1470259078422-826894b933aa?w=800&h=600&fit=crop",
                ],
                Videos = [],
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            },
        };
        await context.Salons.AddRangeAsync(salons);

        // --- SalonMasters ---
        var smIds = new
        {
            BloomAnna  = Guid.Parse("44444444-0000-0000-0000-000000000001"),
            BloomMaria = Guid.Parse("44444444-0000-0000-0000-000000000002"),
            BloomOlga  = Guid.Parse("44444444-0000-0000-0000-000000000003"),
            CharmAnna  = Guid.Parse("44444444-0000-0000-0000-000000000004"),
            CharmOlga  = Guid.Parse("44444444-0000-0000-0000-000000000005"),
        };

        var salonMasters = new List<SalonMaster>
        {
            new() { Id = smIds.BloomAnna,  SalonId = salonIds.Bloom, MasterId = masterIds.Anna,  WorkingHoursStart = new TimeOnly(9,0),  WorkingHoursEnd = new TimeOnly(18,0), WorkingDays = workdaysMonFri },
            new() { Id = smIds.BloomMaria, SalonId = salonIds.Bloom, MasterId = masterIds.Maria, WorkingHoursStart = new TimeOnly(10,0), WorkingHoursEnd = new TimeOnly(19,0), WorkingDays = workdaysMonSat },
            new() { Id = smIds.BloomOlga,  SalonId = salonIds.Bloom, MasterId = masterIds.Olga,  WorkingHoursStart = new TimeOnly(11,0), WorkingHoursEnd = new TimeOnly(20,0), WorkingDays = workdaysMonSat },
            new() { Id = smIds.CharmAnna,  SalonId = salonIds.Charm, MasterId = masterIds.Anna,  WorkingHoursStart = new TimeOnly(14,0), WorkingHoursEnd = new TimeOnly(20,0), WorkingDays = new List<DayOfWeek> { DayOfWeek.Saturday } },
            new() { Id = smIds.CharmOlga,  SalonId = salonIds.Charm, MasterId = masterIds.Olga,  WorkingHoursStart = new TimeOnly(10,0), WorkingHoursEnd = new TimeOnly(18,0), WorkingDays = workdaysMonFri },
        };
        await context.SalonMasters.AddRangeAsync(salonMasters);

        // --- MasterServices ---
        var masterServices = new List<MasterService>
        {
            // Ashley: haircut + coloring
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Anna,  ServiceId = serviceIds.Haircut,  Price = 85,  DurationMinutes = 60 },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Anna,  ServiceId = serviceIds.Coloring, Price = 220, DurationMinutes = 120 },
            // Jessica: manicure + pedicure + eyebrows
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Maria, ServiceId = serviceIds.Manicure, Price = 55,  DurationMinutes = 60 },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Maria, ServiceId = serviceIds.Pedicure, Price = 75,  DurationMinutes = 90 },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Maria, ServiceId = serviceIds.Eyebrows, Price = 35,  DurationMinutes = 30 },
            // Lauren: all services
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Olga,  ServiceId = serviceIds.Haircut,  Price = 95,  DurationMinutes = 60 },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Olga,  ServiceId = serviceIds.Manicure, Price = 60,  DurationMinutes = 60 },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Olga,  ServiceId = serviceIds.Eyebrows, Price = 40,  DurationMinutes = 30 },
        };
        await context.MasterServices.AddRangeAsync(masterServices);

        // --- Time slots: next 14 days for every SalonMaster, 15-min granularity ---
        var timeSlots = new List<TimeSlot>();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        foreach (var sm in salonMasters)
        {
            for (var d = 0; d < 14; d++)
            {
                var date = today.AddDays(d + 1);
                if (!sm.WorkingDays.Contains(date.DayOfWeek)) continue;

                var current = sm.WorkingHoursStart;
                while (current.AddMinutes(15) <= sm.WorkingHoursEnd)
                {
                    var end = current.AddMinutes(15);
                    timeSlots.Add(new TimeSlot
                    {
                        Id = Guid.NewGuid(),
                        SalonMasterId = sm.Id,
                        Date = date,
                        StartTime = current,
                        EndTime = end,
                        Status = TimeSlotStatus.Available,
                    });
                    current = end;
                }
            }
        }
        await context.TimeSlots.AddRangeAsync(timeSlots);

        // --- Sample ratings ---
        var ratings = new List<MasterRating>
        {
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Anna,  ClientName = "Brittany H.", Rating = 5, Comment = "Ashley is absolutely amazing! My hair has never looked this good.", CreatedAt = DateTime.UtcNow.AddDays(-10) },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Anna,  ClientName = "Megan T.",    Rating = 5, Comment = "Perfect balayage, exactly what I wanted. 10/10!", CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Anna,  ClientName = "Rachel K.",   Rating = 4, Comment = "Great results and very professional. Will definitely come back.", CreatedAt = DateTime.UtcNow.AddDays(-2) },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Maria, ClientName = "Stephanie R.", Rating = 5, Comment = "Best manicure in the city — super clean and precise work.", CreatedAt = DateTime.UtcNow.AddDays(-7) },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Maria, ClientName = "Amanda S.",   Rating = 5, Comment = "Incredible nail art, everyone keeps asking where I go!", CreatedAt = DateTime.UtcNow.AddDays(-3) },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Olga,  ClientName = "Nicole B.",   Rating = 5, Comment = "Lauren is a true professional. Highly recommend to anyone!", CreatedAt = DateTime.UtcNow.AddDays(-6) },
            new() { Id = Guid.NewGuid(), MasterId = masterIds.Olga,  ClientName = "Christina M.", Rating = 4, Comment = "Very attentive and skilled. Great overall experience.", CreatedAt = DateTime.UtcNow.AddDays(-1) },
        };
        await context.MasterRatings.AddRangeAsync(ratings);

        await context.SaveChangesAsync();
        logger.LogInformation("Seed data applied successfully.");
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
            if (existing != null) continue;

            var user = new AppUser
            {
                UserName = entry.Email,
                Email = entry.Email,
                EmailConfirmed = true,
                FirstName = entry.FirstName ?? "Super",
                LastName = entry.LastName ?? "Admin",
                Role = Domain.Enums.AppRole.SuperAdmin,
            };

            var result = await userManager.CreateAsync(user, entry.Password);
            if (result.Succeeded)
                logger.LogInformation("SuperAdmin seeded: {Email}", entry.Email);
            else
                logger.LogWarning("Failed to seed SuperAdmin {Email}: {Errors}",
                    entry.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }

    private class SuperAdminSeedEntry
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}
