using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Application.Interfaces;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Tests.Unit.Helpers;
using FluentAssertions;
using Moq;

namespace BeautySalonBooking.Tests.Unit;

public class BookingServiceTests
{
    private readonly Mock<INotificationService> _notifMock = new();

    private BookingService BuildService(InMemoryDbHelper.Ctx ctx) =>
        new(ctx.Db, _notifMock.Object);

    // Helper — sets up a full bookable scenario with auto-approve ON (default)
    private async Task<(
        InMemoryDbHelper.Ctx ctx,
        BookingService svc,
        Guid salonId, Guid masterId,
        Guid serviceId, Guid salonMasterId,
        DateOnly date, TimeOnly slotStart)>
        SetupBookableScenarioAsync(bool autoApprove = true)
    {
        var ctx = InMemoryDbHelper.CreateCtx();
        var svc = BuildService(ctx);

        var salon = await TestData.CreateSalonAsync(ctx.Db);
        var master = await TestData.CreateMasterAsync(ctx.Db, autoApproveBookings: autoApprove);
        var sm = await TestData.LinkMasterAsync(ctx.Db, salon.Id, master.Id);
        var service = await TestData.CreateServiceAsync(ctx.Db);
        await TestData.AddMasterServiceAsync(ctx.Db, master.Id, service.Id, price: 1500, duration: 60);

        var date = new DateOnly(2026, 3, 9);
        var start = new TimeOnly(10, 0);
        await TestData.CreateSlotsAsync(ctx.Db, sm.Id, date, start, start.AddMinutes(120), 60);

        return (ctx, svc, salon.Id, master.Id, service.Id, sm.Id, date, start);
    }

    // ── Create — auto-approve ON ─────────────────────────────────────────────

    [Fact]
    public async Task Create_AutoApproveOn_ReturnsConfirmedStatus()
    {
        var (_, svc, salonId, masterId, serviceId, _, date, start) =
            await SetupBookableScenarioAsync(autoApprove: true);

        var req = new CreateBookingRequest(salonId, masterId, "Alice", "+79991234567", null,
            date.ToString("yyyy-MM-dd"), start.ToString("HH:mm"), [serviceId]);

        var (result, error) = await svc.CreateAsync(req);

        error.Should().BeNull();
        result!.Status.Should().Be("Confirmed");
        result.TotalPrice.Should().Be(1500);
        result.TotalDurationMinutes.Should().Be(60);
    }

    [Fact]
    public async Task Create_AutoApproveOn_NotifiesClientConfirmed()
    {
        var (_, svc, salonId, masterId, serviceId, _, date, start) =
            await SetupBookableScenarioAsync(autoApprove: true);

        var req = new CreateBookingRequest(salonId, masterId, "Alice", "+79991234567", null,
            date.ToString("yyyy-MM-dd"), start.ToString("HH:mm"), [serviceId]);

        var (result, _) = await svc.CreateAsync(req);

        _notifMock.Verify(n => n.SendBookingConfirmedAsync(result!.Id), Times.Once);
        _notifMock.Verify(n => n.SendBookingPendingApprovalAsync(It.IsAny<Guid>()), Times.Never);
    }

    // ── Create — auto-approve OFF ────────────────────────────────────────────

    [Fact]
    public async Task Create_AutoApproveOff_ReturnsPendingStatus()
    {
        var (_, svc, salonId, masterId, serviceId, _, date, start) =
            await SetupBookableScenarioAsync(autoApprove: false);

        var req = new CreateBookingRequest(salonId, masterId, "Bob", "+79990000000", null,
            date.ToString("yyyy-MM-dd"), start.ToString("HH:mm"), [serviceId]);

        var (result, error) = await svc.CreateAsync(req);

        error.Should().BeNull();
        result!.Status.Should().Be("Pending");
    }

    [Fact]
    public async Task Create_AutoApproveOff_NotifiesMasterPendingApproval()
    {
        var (_, svc, salonId, masterId, serviceId, _, date, start) =
            await SetupBookableScenarioAsync(autoApprove: false);

        var req = new CreateBookingRequest(salonId, masterId, "Bob", "+79990000000", null,
            date.ToString("yyyy-MM-dd"), start.ToString("HH:mm"), [serviceId]);

        var (result, _) = await svc.CreateAsync(req);

        _notifMock.Verify(n => n.SendBookingPendingApprovalAsync(result!.Id), Times.Once);
        _notifMock.Verify(n => n.SendBookingConfirmedAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task Create_MarksSlotAsBooked()
    {
        var (ctx, svc, salonId, masterId, serviceId, smId, date, start) =
            await SetupBookableScenarioAsync();

        var req = new CreateBookingRequest(salonId, masterId, "Bob", "+79990000000", null,
            date.ToString("yyyy-MM-dd"), start.ToString("HH:mm"), [serviceId]);

        await svc.CreateAsync(req);

        ctx.Db.TimeSlots
            .Where(s => s.SalonMasterId == smId && s.Date == date && s.StartTime == start)
            .First().Status.Should().Be(TimeSlotStatus.Booked);
    }

    [Fact]
    public async Task Create_SumsMultipleServices()
    {
        var ctx = InMemoryDbHelper.CreateCtx();
        var svc = BuildService(ctx);
        var salon = await TestData.CreateSalonAsync(ctx.Db);
        var master = await TestData.CreateMasterAsync(ctx.Db);
        var sm = await TestData.LinkMasterAsync(ctx.Db, salon.Id, master.Id);
        var s1 = await TestData.CreateServiceAsync(ctx.Db, "A");
        var s2 = await TestData.CreateServiceAsync(ctx.Db, "B");
        await TestData.AddMasterServiceAsync(ctx.Db, master.Id, s1.Id, price: 1000, duration: 60);
        await TestData.AddMasterServiceAsync(ctx.Db, master.Id, s2.Id, price: 2000, duration: 60);

        var date = new DateOnly(2026, 3, 9);
        var start = new TimeOnly(9, 0);
        await TestData.CreateSlotsAsync(ctx.Db, sm.Id, date, start, start.AddMinutes(180), 60);

        var req = new CreateBookingRequest(salon.Id, master.Id, "Dan", "+70000000002", null,
            date.ToString("yyyy-MM-dd"), start.ToString("HH:mm"), [s1.Id, s2.Id]);

        var (result, error) = await svc.CreateAsync(req);

        error.Should().BeNull();
        result!.TotalPrice.Should().Be(3000);
        result.TotalDurationMinutes.Should().Be(120);
    }

    [Fact]
    public async Task Create_Fails_WhenMasterNotLinkedToSalon()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var service = await TestData.CreateServiceAsync(db);
        await TestData.AddMasterServiceAsync(db, master.Id, service.Id);

        var req = new CreateBookingRequest(salon.Id, master.Id, "Eve", "+70000000003", null,
            "2026-03-09", "10:00", [service.Id]);

        var (result, error) = await svc.CreateAsync(req);

        error.Should().NotBeNull();
        result.Should().BeNull();
    }

    [Fact]
    public async Task Create_Fails_WhenInsufficientSlots()
    {
        var ctx = InMemoryDbHelper.CreateCtx();
        var svc = BuildService(ctx);
        var salon = await TestData.CreateSalonAsync(ctx.Db);
        var master = await TestData.CreateMasterAsync(ctx.Db);
        var sm = await TestData.LinkMasterAsync(ctx.Db, salon.Id, master.Id);
        var service = await TestData.CreateServiceAsync(ctx.Db);
        await TestData.AddMasterServiceAsync(ctx.Db, master.Id, service.Id, duration: 120);

        await TestData.CreateSlotsAsync(ctx.Db, sm.Id, new DateOnly(2026, 3, 9),
            new TimeOnly(10, 0), new TimeOnly(11, 0), 60);

        var req = new CreateBookingRequest(salon.Id, master.Id, "Frank", "+70000000004", null,
            "2026-03-09", "10:00", [service.Id]);

        var (result, error) = await svc.CreateAsync(req);

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task Create_Fails_WhenSalonNotFound()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var req = new CreateBookingRequest(Guid.NewGuid(), Guid.NewGuid(), "G", "+1", null,
            "2026-03-09", "10:00", [Guid.NewGuid()]);

        var (result, error) = await svc.CreateAsync(req);

        error.Should().NotBeNull();
    }

    // ── Confirm ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Confirm_ChangesStatusToConfirmed()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Pending);

        var (result, error) = await svc.ConfirmAsync(booking.Id);

        error.Should().BeNull();
        result!.Status.Should().Be("Confirmed");
    }

    [Fact]
    public async Task Confirm_NotifiesClientConfirmed()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Pending);

        var (result, _) = await svc.ConfirmAsync(booking.Id);

        _notifMock.Verify(n => n.SendBookingConfirmedAsync(result!.Id), Times.Once);
    }

    [Fact]
    public async Task Confirm_Fails_WhenAlreadyConfirmed()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Confirmed);

        var (result, error) = await svc.ConfirmAsync(booking.Id);

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task Confirm_ReturnsNull_WhenNotFound()
    {
        var (result, error) = await new BookingService(InMemoryDbHelper.Create(), _notifMock.Object)
            .ConfirmAsync(Guid.NewGuid());
        result.Should().BeNull();
    }

    // ── Complete ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Complete_Succeeds_WhenConfirmedAndTimePassed()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var pastDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2));
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id,
            BookingStatus.Confirmed, date: pastDate, start: new TimeOnly(9, 0));

        var (result, error) = await svc.CompleteAsync(booking.Id);

        error.Should().BeNull();
        result!.Status.Should().Be("Completed");
        result.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Complete_NotifiesClientCompleted()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var pastDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2));
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id,
            BookingStatus.Confirmed, date: pastDate, start: new TimeOnly(9, 0));

        var (result, _) = await svc.CompleteAsync(booking.Id);

        _notifMock.Verify(n => n.SendBookingCompletedAsync(result!.Id), Times.Once);
    }

    [Fact]
    public async Task Complete_Fails_WhenNotConfirmed()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Pending);

        var (result, error) = await svc.CompleteAsync(booking.Id);

        error.Should().NotBeNull();
    }

    [Fact]
    public async Task Complete_Fails_WhenBookingTimeNotYetPassed()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id,
            BookingStatus.Confirmed, date: futureDate);

        var (result, error) = await svc.CompleteAsync(booking.Id);

        error.Should().NotBeNull();
    }

    // ── Cancel ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Cancel_ByClient_SetsCorrectStatus()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Confirmed);

        var (result, error) = await svc.CancelAsync(booking.Id, new CancelBookingRequest("Client", "Changed mind"));

        error.Should().BeNull();
        result!.Status.Should().Be("CancelledByClient");
        result.CancellationReason.Should().Be("Changed mind");
        result.CancelledAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Cancel_ByMaster_SetsCorrectStatus()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Pending);

        var (result, error) = await svc.CancelAsync(booking.Id, new CancelBookingRequest("Master", "Sick"));

        error.Should().BeNull();
        result!.Status.Should().Be("CancelledByMaster");
    }

    [Fact]
    public async Task Cancel_NotifiesBothParties()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Pending);

        var (result, _) = await svc.CancelAsync(booking.Id, new CancelBookingRequest("Client", null));

        _notifMock.Verify(n => n.SendBookingCancelledAsync(booking.Id, CancellationSide.Client), Times.Once);
    }

    [Fact]
    public async Task Cancel_ReleasesBookedSlots()
    {
        var (ctx, svc, salonId, masterId, serviceId, smId, date, start) =
            await SetupBookableScenarioAsync();

        var req = new CreateBookingRequest(salonId, masterId, "Harry", "+70000000005", null,
            date.ToString("yyyy-MM-dd"), start.ToString("HH:mm"), [serviceId]);
        var (booking, _) = await svc.CreateAsync(req);

        await svc.CancelAsync(booking!.Id, new CancelBookingRequest("Client", null));

        ctx.Db.TimeSlots
            .Where(s => s.SalonMasterId == smId && s.Date == date && s.StartTime == start)
            .First().Status.Should().Be(TimeSlotStatus.Available);
    }

    [Fact]
    public async Task Cancel_Fails_WhenAlreadyCompleted()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        var booking = await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Completed);

        var (result, error) = await svc.CancelAsync(booking.Id, new CancelBookingRequest("Client", null));

        error.Should().NotBeNull();
    }

    // ── GetAll with filters ───────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_FiltersBySalon()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon1 = await TestData.CreateSalonAsync(db, "S1");
        var salon2 = await TestData.CreateSalonAsync(db, "S2");
        var master = await TestData.CreateMasterAsync(db);
        await TestData.CreateBookingAsync(db, salon1.Id, master.Id);
        await TestData.CreateBookingAsync(db, salon2.Id, master.Id);

        var result = await svc.GetAllAsync(new BookingFilterRequest(salon1.Id, null, null, null, null));

        result.Should().HaveCount(1);
        result[0].SalonId.Should().Be(salon1.Id);
    }

    [Fact]
    public async Task GetAll_FiltersByStatus()
    {
        var db = InMemoryDbHelper.Create();
        var svc = new BookingService(db, _notifMock.Object);
        var salon = await TestData.CreateSalonAsync(db);
        var master = await TestData.CreateMasterAsync(db);
        await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Pending);
        await TestData.CreateBookingAsync(db, salon.Id, master.Id, BookingStatus.Confirmed);

        var result = await svc.GetAllAsync(new BookingFilterRequest(null, null, "Confirmed", null, null));

        result.Should().HaveCount(1);
        result[0].Status.Should().Be("Confirmed");
    }
}
