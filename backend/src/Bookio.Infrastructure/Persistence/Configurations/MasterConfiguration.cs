using Bookio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bookio.Infrastructure.Persistence.Configurations;

public class MasterConfiguration : IEntityTypeConfiguration<Master>
{
    public void Configure(EntityTypeBuilder<Master> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Photo).HasMaxLength(1000);
        builder.Property(m => m.Description).HasMaxLength(2000);

        builder.HasMany(m => m.SalonMasters).WithOne(sm => sm.Master).HasForeignKey(sm => sm.MasterId);
        builder.HasMany(m => m.MasterServices).WithOne(ms => ms.Master).HasForeignKey(ms => ms.MasterId);
        builder.HasMany(m => m.Bookings).WithOne(b => b.Master).HasForeignKey(b => b.MasterId);
        builder.HasMany(m => m.Ratings).WithOne(r => r.Master).HasForeignKey(r => r.MasterId);
    }
}
