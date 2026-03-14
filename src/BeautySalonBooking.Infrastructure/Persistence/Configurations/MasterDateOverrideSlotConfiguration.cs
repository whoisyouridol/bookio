using BeautySalonBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BeautySalonBooking.Infrastructure.Persistence.Configurations;

public class MasterDateOverrideSlotConfiguration : IEntityTypeConfiguration<MasterDateOverrideSlot>
{
    public void Configure(EntityTypeBuilder<MasterDateOverrideSlot> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.DateOverride)
            .WithMany(d => d.Slots)
            .HasForeignKey(s => s.DateOverrideId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
