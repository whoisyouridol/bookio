using BeautySalonBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonBooking.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Salon> Salons => Set<Salon>();
    public DbSet<Master> Masters => Set<Master>();
    public DbSet<SalonMaster> SalonMasters => Set<SalonMaster>();
    public DbSet<Domain.Entities.Service> Services => Set<Domain.Entities.Service>();
    public DbSet<MasterService> MasterServices => Set<MasterService>();
    public DbSet<TimeSlot> TimeSlots => Set<TimeSlot>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingService> BookingServices => Set<BookingService>();
    public DbSet<MasterRating> MasterRatings => Set<MasterRating>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
