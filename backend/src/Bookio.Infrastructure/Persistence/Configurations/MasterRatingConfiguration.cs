using Bookio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bookio.Infrastructure.Persistence.Configurations;

public class MasterRatingConfiguration : IEntityTypeConfiguration<MasterRating>
{
    public void Configure(EntityTypeBuilder<MasterRating> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.ClientName).IsRequired().HasMaxLength(200);
        builder.Property(r => r.Comment).HasMaxLength(2000);
    }
}
