using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Infrastructure.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Salon> Salons => Set<Salon>();
    public DbSet<Master> Masters => Set<Master>();
    public DbSet<SalonMaster> SalonMasters => Set<SalonMaster>();
    public DbSet<Domain.Entities.Service> Services => Set<Domain.Entities.Service>();
    public DbSet<MasterService> MasterServices => Set<MasterService>();
public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingService> BookingServices => Set<BookingService>();
    public DbSet<MasterRating> MasterRatings => Set<MasterRating>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<MasterWeeklySlot> MasterWeeklySlots => Set<MasterWeeklySlot>();
    public DbSet<MasterDateOverride> MasterDateOverrides => Set<MasterDateOverride>();
    public DbSet<MasterDateOverrideSlot> MasterDateOverrideSlots => Set<MasterDateOverrideSlot>();
    public DbSet<MasterTimeOff> MasterTimeOffs => Set<MasterTimeOff>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder); // required for Identity tables
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
