using BeautySalonBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BeautySalonBooking.Infrastructure.Persistence.Configurations;

public class SalonMasterConfiguration : IEntityTypeConfiguration<SalonMaster>
{
    public void Configure(EntityTypeBuilder<SalonMaster> builder)
    {
        builder.HasKey(sm => sm.Id);
        builder.HasIndex(sm => new { sm.SalonId, sm.MasterId }).IsUnique();
    }
}
