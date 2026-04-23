using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Application.Interfaces;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Entities;
using BeautySalonBooking.Infrastructure.Observability;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class BookingService
{
    private readonly AppDbContext _db;
    private readonly AvailabilityService _availability;
    private readonly INotificationService _notifications;
    private readonly ILogger<BookingService> _logger;
    private readonly int _tzOffsetHours;

    public BookingService(AppDbContext db, AvailabilityService availability,
        INotificationService notifications, IConfiguration config,
        ILogger<BookingService> logger)
    {
        _db = db;
        _availability = availability;
        _notifications = notifications;
        _logger = logger;
        _tzOffsetHours = config.GetValue<int>("Booking:TimezoneOffsetHours", 0);
    }

    /// <summary>Returns the current "local now" for the business timezone.</summary>
    private DateTime LocalNow => DateTime.UtcNow.AddHours(_tzOffsetHours);

    public async Task<List<BookingDto>> GetAllAsync(BookingFilterRequest filter)
    {
        var query = _db.Bookings
            .Include(b => b.Salon)
            .Include(b => b.BookingServices).ThenInclude(bs => bs.MasterService).ThenInclude(ms => ms.Service)
            .AsQueryable();

        if (filter.SalonId.HasValue) query = query.Where(b => b.SalonId == filter.SalonId);
        if (filter.MasterId.HasValue) query = query.Where(b => b.MasterId == filter.MasterId);
        if (!string.IsNullOrEmpty(filter.Status) && Enum.TryParse<BookingStatus>(filter.Status, out var status))
            query = query.Where(b => b.Status == status);
        if (!string.IsNullOrEmpty(filter.DateFrom) && DateOnly.TryParse(filter.DateFrom, out var dateFrom))
            query = query.Where(b => b.BookingDate >= dateFrom);
        if (!string.IsNullOrEmpty(filter.DateTo) && DateOnly.TryParse(filter.DateTo, out var dateTo))
            query = query.Where(b => b.BookingDate <= dateTo);

        var bookings = await query.OrderByDescending(b => b.BookingDate).ThenBy(b => b.StartTime).ToListAsync();
        var masterNames = await GetMasterNamesAsync(bookings.Select(b => b.MasterId).Distinct());
        return bookings.Select(b => MapToDto(b, masterNames.GetValueOrDefault(b.MasterId, ""))).ToList();
    }

    public async Task<BookingDto?> GetByIdAsync(Guid id)
    {
        var b = await _db.Bookings
            .Include(x => x.Salon)
            .Include(x => x.BookingServices).ThenInclude(bs => bs.MasterService).ThenInclude(ms => ms.Service)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (b == null) return null;
        var masterNames = await GetMasterNamesAsync([b.MasterId]);
        return MapToDto(b, masterNames.GetValueOrDefault(b.MasterId, ""));
    }

    public async Task<List<BookingDto>> GetMyBookingsAsync(Guid userId, Guid? salonId = null)
    {
        var query = _db.Bookings
            .Include(b => b.Salon)
            .Include(b => b.BookingServices).ThenInclude(bs => bs.MasterService).ThenInclude(ms => ms.Service)
            .Where(b => b.UserId == userId);

        if (salonId.HasValue)
            query = query.Where(b => b.SalonId == salonId.Value);

        var bookings = await query
            .OrderByDescending(b => b.BookingDate).ThenBy(b => b.StartTime)
            .ToListAsync();
        var masterNames = await GetMasterNamesAsync(bookings.Select(b => b.MasterId).Distinct());
        return bookings.Select(b => MapToDto(b, masterNames.GetValueOrDefault(b.MasterId, ""))).ToList();
    }

    public async Task<(BookingDto? result, string? error)> CreateAsync(CreateBookingRequest req, Guid? userId = null)
    {
        using var activity = Telemetry.Source.StartActivity("Booking.Create");
        activity?.SetTag("booking.salon_id", req.SalonId.ToString());
        activity?.SetTag("booking.master_id", req.MasterId.ToString());
        activity?.SetTag("booking.service_count", req.ServiceIds.Count);
        activity?.SetTag("booking.date", req.BookingDate);

        _logger.LogInformation("Creating booking: Salon={SalonId} Master={MasterId} Services={ServiceCount} Date={Date} Time={Time}",
            req.SalonId, req.MasterId, req.ServiceIds.Count, req.BookingDate, req.StartTime);

        if (!DateOnly.TryParse(req.BookingDate, out var date))
            return (null, "Invalid booking date");
        if (!TimeOnly.TryParse(req.StartTime, out var startTime))
            return (null, "Invalid start time");

        // Reject bookings in the past using the configured business timezone.
        // Booking datetimes are stored in local time; LocalNow converts UTC to local.
        if (date.ToDateTime(startTime) < LocalNow)
            return (null, "Cannot book appointments in the past");

        var salonExists = await _db.Salons.AnyAsync(s => s.Id == req.SalonId && s.IsActive);
        if (!salonExists) return (null, "Salon not found");

        var master = await _db.Masters.FirstOrDefaultAsync(m => m.Id == req.MasterId && !m.IsDeleted);
        if (master == null) return (null, "Master not found");

        var sm = await _db.SalonMasters.FirstOrDefaultAsync(x => x.SalonId == req.SalonId && x.MasterId == req.MasterId && x.IsActive);
        if (sm == null) return (null, "Master does not work at this salon");

        var masterServices = await _db.MasterServices
            .Include(ms => ms.Service)
            .Where(ms => ms.MasterId == req.MasterId && req.ServiceIds.Contains(ms.ServiceId) && ms.IsActive)
            .ToListAsync();

        if (masterServices.Count != req.ServiceIds.Count)
            return (null, "One or more services not found for this master");

        int totalDuration = masterServices.Sum(ms => ms.DurationMinutes);
        decimal totalPrice = masterServices.Sum(ms => ms.Price);
        var endTime = startTime.AddMinutes(totalDuration);

        // Use serializable transaction to prevent concurrent double bookings.
        // The validate + insert must be atomic — without this, two concurrent requests
        // for the same slot can both pass validation and both create bookings.
        await using var transaction = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable);

        try
        {
            // Validate availability using on-the-fly engine (no pre-generated slots needed)
            var (available, availError) = await _availability.ValidateBookingSlotAsync(
                req.SalonId, req.MasterId, date, startTime, endTime);
            if (!available)
                return (null, availError ?? "The requested time slot is not available");

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                SalonId = req.SalonId,
                MasterId = req.MasterId,
                UserId = userId,
                ClientName = req.ClientName,
                ClientPhone = req.ClientPhone,
                ClientEmail = req.ClientEmail,
                BookingDate = date,
                StartTime = startTime,
                EndTime = endTime,
                TotalPrice = totalPrice,
                TotalDurationMinutes = totalDuration,
                Status = BookingStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            booking.BookingServices = masterServices.Select(ms => new Domain.Entities.BookingService
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                MasterServiceId = ms.Id,
                Price = ms.Price,
                DurationMinutes = ms.DurationMinutes,
            }).ToList();

            _db.Bookings.Add(booking);

            if (master.AutoApproveBookings)
            {
                booking.Status = BookingStatus.Confirmed;
                booking.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            activity?.SetTag("booking.id", booking.Id.ToString());
            activity?.SetTag("booking.status", booking.Status.ToString());
            activity?.SetTag("booking.total_price", totalPrice);
            _logger.LogInformation("Booking created BookingId={BookingId} Status={Status} Price={Price}",
                booking.Id, booking.Status, totalPrice);

            if (master.AutoApproveBookings)
                await _notifications.SendBookingConfirmedAsync(booking.Id);
            else
                await _notifications.SendBookingPendingApprovalAsync(booking.Id);

            var created = await _db.Bookings
                .Include(b => b.Salon)
                .Include(b => b.BookingServices).ThenInclude(bs => bs.MasterService).ThenInclude(ms => ms.Service)
                .FirstAsync(b => b.Id == booking.Id);

            var createdNames = await GetMasterNamesAsync([created.MasterId]);
            return (MapToDto(created, createdNames.GetValueOrDefault(created.MasterId, "")), null);
        }
        catch (DbUpdateException)
        {
            // Serialization failure or unique constraint violation — another booking took the slot
            return (null, "The requested time slot is no longer available. Please choose another time.");
        }
    }

    public async Task<(BookingDto? result, string? error)> ConfirmAsync(Guid id)
    {
        var booking = await LoadFullAsync(id);
        if (booking == null) return (null, "Booking not found");
        if (booking.Status != BookingStatus.Pending) return (null, "Only pending bookings can be confirmed");

        booking.Status = BookingStatus.Confirmed;
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notifications.SendBookingConfirmedAsync(booking.Id);

        var names1 = await GetMasterNamesAsync([booking.MasterId]);
        return (MapToDto(booking, names1.GetValueOrDefault(booking.MasterId, "")), null);
    }

    public async Task<(BookingDto? result, string? error)> CompleteAsync(Guid id)
    {
        var booking = await LoadFullAsync(id);
        if (booking == null) return (null, "Booking not found");
        if (booking.Status != BookingStatus.Confirmed) return (null, "Only confirmed bookings can be completed");

        var bookingEnd = booking.BookingDate.ToDateTime(booking.EndTime);
        if (LocalNow < bookingEnd) return (null, "Cannot complete a booking before its end time");

        booking.Status = BookingStatus.Completed;
        booking.CompletedAt = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notifications.SendBookingCompletedAsync(booking.Id);

        var names2 = await GetMasterNamesAsync([booking.MasterId]);
        return (MapToDto(booking, names2.GetValueOrDefault(booking.MasterId, "")), null);
    }

    public async Task<(BookingDto? result, string? error)> CancelAsync(Guid id, CancelBookingRequest req)
    {
        var booking = await LoadFullAsync(id);
        if (booking == null) return (null, "Booking not found");
        if (booking.Status != BookingStatus.Pending && booking.Status != BookingStatus.Confirmed)
            return (null, "Only pending or confirmed bookings can be cancelled");

        var side = string.Equals(req.Side, "Master", StringComparison.OrdinalIgnoreCase)
            ? CancellationSide.Master : CancellationSide.Client;
        booking.Status = side == CancellationSide.Master ? BookingStatus.CancelledByMaster : BookingStatus.CancelledByClient;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancellationReason = req.Reason;
        booking.UpdatedAt = DateTime.UtcNow;

        // No need to release TimeSlot records — availability is computed on-the-fly
        // from bookings. Cancelling the booking automatically frees the time.
        await _db.SaveChangesAsync();
        await _notifications.SendBookingCancelledAsync(booking.Id, side);

        var names3 = await GetMasterNamesAsync([booking.MasterId]);
        return (MapToDto(booking, names3.GetValueOrDefault(booking.MasterId, "")), null);
    }

    public async Task<List<BookingDto>> GetBySalonAsync(Guid salonId)
        => await GetAllAsync(new BookingFilterRequest(salonId, null, null, null, null));

    public async Task<List<BookingDto>> GetByMasterAsync(Guid masterId)
        => await GetAllAsync(new BookingFilterRequest(null, masterId, null, null, null));

    private async Task<Booking?> LoadFullAsync(Guid id) => await _db.Bookings
        .Include(b => b.Salon)
        .Include(b => b.BookingServices).ThenInclude(bs => bs.MasterService).ThenInclude(ms => ms.Service)
        .FirstOrDefaultAsync(b => b.Id == id);

    private async Task<Dictionary<Guid, string>> GetMasterNamesAsync(IEnumerable<Guid> masterIds)
    {
        var ids = masterIds.ToList();
        return await _db.Set<AppUser>()
            .Where(u => u.MasterId != null && ids.Contains(u.MasterId.Value))
            .ToDictionaryAsync(
                u => u.MasterId!.Value,
                u => $"{u.FirstName} {u.LastName}".Trim());
    }

    private static BookingDto MapToDto(Booking b, string masterName) => new(
        b.Id, b.SalonId, b.Salon.Name,
        b.MasterId, masterName,
        b.ClientName, b.ClientPhone, b.ClientEmail,
        b.BookingDate.ToString("yyyy-MM-dd"),
        b.StartTime.ToString("HH:mm"),
        b.EndTime.ToString("HH:mm"),
        b.TotalPrice, b.TotalDurationMinutes,
        b.Status.ToString(), b.CreatedAt, b.CompletedAt, b.CancelledAt, b.CancellationReason,
        b.BookingServices.Select(bs => new BookingServiceDto(
            bs.Id, bs.MasterService.ServiceId, bs.MasterService.Service.Name, bs.Price, bs.DurationMinutes
        )).ToList()
    );
}
