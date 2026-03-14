using BeautySalonBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BeautySalonBooking.Infrastructure.Persistence.Configurations;

public class MasterWeeklySlotConfiguration : IEntityTypeConfiguration<MasterWeeklySlot>
{
    public void Configure(EntityTypeBuilder<MasterWeeklySlot> builder)
    {
        builder.HasKey(w => w.Id);

        builder.Property(w => w.DayOfWeek)
            .HasConversion<string>();

        // One time window per day per salon-master (can have multiple windows per day, e.g. morning + afternoon)
        builder.HasOne(w => w.SalonMaster)
            .WithMany(sm => sm.WeeklySlots)
            .HasForeignKey(w => w.SalonMasterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => new { w.SalonMasterId, w.DayOfWeek, w.StartTime }).IsUnique();
    }
}
