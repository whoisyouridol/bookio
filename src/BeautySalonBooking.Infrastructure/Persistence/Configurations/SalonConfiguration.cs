using BeautySalonBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;

namespace BeautySalonBooking.Infrastructure.Persistence.Configurations;

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
        builder.Property(s => s.YandexMapsUrl).HasMaxLength(1000);
        builder.Property(s => s.PrimaryColor).HasMaxLength(20);
        builder.Property(s => s.AccentColor).HasMaxLength(20);
        builder.Property(s => s.BorderRadius).HasMaxLength(20);
        builder.Property(s => s.LogoUrl).HasMaxLength(1000);

        var listDowComparer = new ValueComparer<List<DayOfWeek>>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (a, x) => HashCode.Combine(a, x.GetHashCode())),
            v => v.ToList());

        var listStrComparer = new ValueComparer<List<string>>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (a, x) => HashCode.Combine(a, x.GetHashCode())),
            v => v.ToList());

        builder.Property(s => s.WorkingDays)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                v => JsonSerializer.Deserialize<List<DayOfWeek>>(v, JsonOpts) ?? new())
            .HasColumnType("jsonb")
            .Metadata.SetValueComparer(listDowComparer);

        builder.Property(s => s.Photos)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                v => JsonSerializer.Deserialize<List<string>>(v, JsonOpts) ?? new())
            .HasColumnType("jsonb")
            .Metadata.SetValueComparer(listStrComparer);

        builder.Property(s => s.Videos)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                v => JsonSerializer.Deserialize<List<string>>(v, JsonOpts) ?? new())
            .HasColumnType("jsonb")
            .Metadata.SetValueComparer(listStrComparer);

        builder.HasMany(s => s.SalonMasters).WithOne(sm => sm.Salon).HasForeignKey(sm => sm.SalonId);
        builder.HasMany(s => s.Bookings).WithOne(b => b.Salon).HasForeignKey(b => b.SalonId);
    }
}
