using Bookio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bookio.Infrastructure.Persistence.Configurations;

public class MasterDateOverrideConfiguration : IEntityTypeConfiguration<MasterDateOverride>
{
    public void Configure(EntityTypeBuilder<MasterDateOverride> builder)
    {
        builder.HasKey(d => d.Id);

        // One override per date per salon-master
        builder.HasIndex(d => new { d.SalonMasterId, d.Date }).IsUnique();

        builder.HasOne(d => d.SalonMaster)
            .WithMany(sm => sm.DateOverrides)
            .HasForeignKey(d => d.SalonMasterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(d => d.Slots)
            .WithOne(s => s.DateOverride)
            .HasForeignKey(s => s.DateOverrideId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
