using BeautySalonBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;

namespace BeautySalonBooking.Infrastructure.Persistence.Configurations;

public class SalonMasterConfiguration : IEntityTypeConfiguration<SalonMaster>
{
    private static readonly JsonSerializerOptions JsonOpts = new();

    public void Configure(EntityTypeBuilder<SalonMaster> builder)
    {
        builder.HasKey(sm => sm.Id);

        var comparer = new ValueComparer<List<DayOfWeek>>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (a, x) => HashCode.Combine(a, x.GetHashCode())),
            v => v.ToList());

        builder.Property(sm => sm.WorkingDays)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                v => JsonSerializer.Deserialize<List<DayOfWeek>>(v, JsonOpts) ?? new())
            .HasColumnType("jsonb")
            .Metadata.SetValueComparer(comparer);

        builder.HasIndex(sm => new { sm.SalonId, sm.MasterId }).IsUnique();

        builder.HasMany(sm => sm.TimeSlots).WithOne(ts => ts.SalonMaster).HasForeignKey(ts => ts.SalonMasterId);
    }
}
