using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Persistence;
using DomainMasterService = BeautySalonBooking.Domain.Entities.MasterService;

namespace BeautySalonBooking.Tests.Unit.Helpers;

/// <summary>Factory helpers that insert common domain objects for unit tests.</summary>
public static class TestData
{
    public static readonly List<DayOfWeek> WeekDays =
    [
        DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday,
        DayOfWeek.Thursday, DayOfWeek.Friday
    ];

    public static async Task<Salon> CreateSalonAsync(AppDbContext db, string name = "Test Salon")
    {
        var salon = new Salon
        {
            Id = Guid.NewGuid(), Name = name, Address = "123 Test St",
            WorkingHoursStart = new TimeOnly(9, 0), WorkingHoursEnd = new TimeOnly(21, 0),
            WorkingDays = WeekDays,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        db.Salons.Add(salon);
        await db.SaveChangesAsync();
        return salon;
    }

    public static async Task<Master> CreateMasterAsync(AppDbContext db, string description = "Test Master", bool autoApproveBookings = true)
    {
        var master = new Master
        {
            Id = Guid.NewGuid(), Description = description,
            AutoApproveBookings = autoApproveBookings,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        db.Masters.Add(master);
        await db.SaveChangesAsync();
        return master;
    }

    public static async Task<SalonMaster> LinkMasterAsync(AppDbContext db, Guid salonId, Guid masterId)
    {
        var sm = new SalonMaster
        {
            Id = Guid.NewGuid(), SalonId = salonId, MasterId = masterId,
        };
        db.SalonMasters.Add(sm);
        await db.SaveChangesAsync();
        return sm;
    }

    /// <summary>Link a master and auto-create weekly slots from the salon's schedule.</summary>
    public static async Task<SalonMaster> LinkMasterWithSlotsAsync(AppDbContext db, Guid salonId, Guid masterId)
    {
        var sm = await LinkMasterAsync(db, salonId, masterId);
        var salon = await db.Salons.FindAsync(salonId);
        var slots = salon!.WorkingDays.Select(day => new MasterWeeklySlot
        {
            Id = Guid.NewGuid(),
            SalonMasterId = sm.Id,
            DayOfWeek = day,
            StartTime = salon.WorkingHoursStart,
            EndTime = salon.WorkingHoursEnd,
        }).ToList();
        db.MasterWeeklySlots.AddRange(slots);
        await db.SaveChangesAsync();
        return sm;
    }

    public static async Task<Domain.Entities.Service> CreateServiceAsync(AppDbContext db, string name = "Test Service")
    {
        var svc = new Domain.Entities.Service
        {
            Id = Guid.NewGuid(), Name = name,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        db.Services.Add(svc);
        await db.SaveChangesAsync();
        return svc;
    }

    public static async Task<DomainMasterService> AddMasterServiceAsync(AppDbContext db, Guid masterId, Guid serviceId,
        decimal price = 1000, int duration = 60)
    {
        var ms = new DomainMasterService
        {
            Id = Guid.NewGuid(), MasterId = masterId, ServiceId = serviceId,
            Price = price, DurationMinutes = duration
        };
        db.MasterServices.Add(ms);
        await db.SaveChangesAsync();
        return ms;
    }

    public static async Task<Booking> CreateBookingAsync(AppDbContext db, Guid salonId, Guid masterId,
        BookingStatus status = BookingStatus.Pending,
        DateOnly? date = null, TimeOnly? start = null)
    {
        var bookingDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var startTime = start ?? new TimeOnly(10, 0);
        var booking = new Booking
        {
            Id = Guid.NewGuid(), SalonId = salonId, MasterId = masterId,
            ClientName = "Test Client", ClientPhone = "+70009998877",
            BookingDate = bookingDate, StartTime = startTime, EndTime = startTime.AddMinutes(60),
            TotalPrice = 1000, TotalDurationMinutes = 60,
            Status = status, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();
        return booking;
    }
}
