using Bookio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;

namespace Bookio.Infrastructure.Persistence.Configurations;

public class SalonConfiguration : IEntityTypeConfiguration<Salon>
{
    private static readonly JsonSerializerOptions JsonOpts = new();

    public void Configure(EntityTypeBuilder<Salon> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Name).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Slug).HasMaxLength(100);
        builder.HasIndex(s => s.Slug).IsUnique().HasFilter("\"Slug\" IS NOT NULL");
        builder.Property(s => s.Address).IsRequired().HasMaxLength(500);
        builder.Property(s => s.GoogleMapsUrl).HasMaxLength(1000);
        builder.Property(s => s.CoverPicture).HasMaxLength(1000);

        var listDowComparer = new ValueComparer<List<DayOfWeek>>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (a, x) => HashCode.Combine(a, x.GetHashCode())),
            v => v.ToList());

        builder.Property(s => s.WorkingDays)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                v => JsonSerializer.Deserialize<List<DayOfWeek>>(v, JsonOpts) ?? new())
            .HasColumnType("jsonb")
            .Metadata.SetValueComparer(listDowComparer);

        builder.HasMany(s => s.SalonMasters).WithOne(sm => sm.Salon).HasForeignKey(sm => sm.SalonId);
        builder.HasMany(s => s.Bookings).WithOne(b => b.Salon).HasForeignKey(b => b.SalonId);
    }
}
