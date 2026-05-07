using Bookio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bookio.Infrastructure.Persistence.Configurations;

public class MasterServiceConfiguration : IEntityTypeConfiguration<MasterService>
{
    public void Configure(EntityTypeBuilder<MasterService> builder)
    {
        builder.HasKey(ms => ms.Id);
        builder.Property(ms => ms.Price).HasColumnType("numeric(18,2)");
        builder.HasIndex(ms => new { ms.MasterId, ms.ServiceId }).IsUnique();

        builder.HasMany(ms => ms.BookingServices).WithOne(bs => bs.MasterService).HasForeignKey(bs => bs.MasterServiceId);
    }
}
