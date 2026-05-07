using Bookio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bookio.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.ClientName).IsRequired().HasMaxLength(200);
        builder.Property(b => b.ClientPhone).HasMaxLength(20);
        builder.Property(b => b.ClientEmail).HasMaxLength(200);
        builder.Property(b => b.TotalPrice).HasColumnType("numeric(18,2)");
        builder.Property(b => b.Status).HasConversion<string>();
        builder.Property(b => b.CancellationReason).HasMaxLength(1000);

        builder.HasMany(b => b.BookingServices).WithOne(bs => bs.Booking).HasForeignKey(bs => bs.BookingId);
        builder.HasOne(b => b.Rating).WithOne(r => r.Booking).HasForeignKey<MasterRating>(r => r.BookingId);
    }
}
