using Bookio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bookio.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Type).HasConversion<string>();
        builder.Property(n => n.Channel).HasConversion<string>();
        builder.Property(n => n.Status).HasConversion<string>();

        builder.Property(n => n.RecipientEmail).HasMaxLength(256);
        builder.Property(n => n.RecipientPhone).HasMaxLength(20);
        builder.Property(n => n.Subject).HasMaxLength(500);
        builder.Property(n => n.Body).HasColumnType("text");
        builder.Property(n => n.FailureReason).HasMaxLength(2000);
        builder.Property(n => n.HangfireJobId).HasMaxLength(100);

        builder.HasOne(n => n.Booking)
            .WithMany(b => b.Notifications)
            .HasForeignKey(n => n.BookingId);

        builder.HasIndex(n => new { n.Status, n.ScheduledAt });
        builder.HasIndex(n => n.BookingId);
        builder.HasIndex(n => new { n.BookingId, n.Type, n.Channel }).IsUnique();
    }
}
