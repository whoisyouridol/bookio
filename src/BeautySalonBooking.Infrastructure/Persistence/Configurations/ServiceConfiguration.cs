using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BeautySalonBooking.Infrastructure.Persistence.Configurations;

public class ServiceConfiguration : IEntityTypeConfiguration<Domain.Entities.Service>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Service> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Name).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Description).HasMaxLength(2000);
        builder.Property(s => s.Photo).HasMaxLength(1000);

        builder.HasMany(s => s.MasterServices).WithOne(ms => ms.Service).HasForeignKey(ms => ms.ServiceId);
    }
}
