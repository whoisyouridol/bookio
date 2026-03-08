using BeautySalonBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BeautySalonBooking.Infrastructure.Persistence.Configurations;

public class TimeSlotConfiguration : IEntityTypeConfiguration<TimeSlot>
{
    public void Configure(EntityTypeBuilder<TimeSlot> builder)
    {
        builder.HasKey(ts => ts.Id);
        builder.Property(ts => ts.Status).HasConversion<string>();
        builder.HasIndex(ts => new { ts.SalonMasterId, ts.Date, ts.StartTime }).IsUnique();
    }
}
