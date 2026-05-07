using Bookio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bookio.Infrastructure.Persistence.Configurations;

public class MasterTimeOffConfiguration : IEntityTypeConfiguration<MasterTimeOff>
{
    public void Configure(EntityTypeBuilder<MasterTimeOff> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Reason).HasMaxLength(500);

        builder.HasOne(t => t.SalonMaster)
            .WithMany(sm => sm.TimeOffs)
            .HasForeignKey(t => t.SalonMasterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => new { t.SalonMasterId, t.StartDate, t.EndDate });
    }
}
