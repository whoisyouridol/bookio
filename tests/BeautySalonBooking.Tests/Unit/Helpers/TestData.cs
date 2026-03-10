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
            WorkingDays = WeekDays, Photos = [], Videos = [],
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        db.Salons.Add(salon);
        await db.SaveChangesAsync();
        return salon;
    }

    public static async Task<Master> CreateMasterAsync(AppDbContext db, string firstName = "Test", string lastName = "Master", bool autoApproveBookings = true)
    {
        var master = new Master
        {
            Id = Guid.NewGuid(), FirstName = firstName, LastName = lastName,
            Phone = "+70001112233", AutoApproveBookings = autoApproveBookings,
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
            WorkingHoursStart = new TimeOnly(9, 0), WorkingHoursEnd = new TimeOnly(18, 0),
            WorkingDays = WeekDays
        };
        db.SalonMasters.Add(sm);
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

    public static async Task<List<TimeSlot>> CreateSlotsAsync(AppDbContext db, Guid salonMasterId,
        DateOnly date, TimeOnly from, TimeOnly to, int slotMinutes = 60)
    {
        var slots = new List<TimeSlot>();
        var cur = from;
        while (cur.AddMinutes(slotMinutes) <= to)
        {
            slots.Add(new TimeSlot
            {
                Id = Guid.NewGuid(), SalonMasterId = salonMasterId,
                Date = date, StartTime = cur, EndTime = cur.AddMinutes(slotMinutes),
                Status = TimeSlotStatus.Available
            });
            cur = cur.AddMinutes(slotMinutes);
        }
        db.TimeSlots.AddRange(slots);
        await db.SaveChangesAsync();
        return slots;
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
