using System.Net;
using System.Text.Json;
using BeautySalonBooking.Tests.Integration.Setup;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Integration;

public class BookingsControllerTests : IntegrationTestBase
{
    public BookingsControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    // Full setup: salon → master → link → service → master-service → slots
    private async Task<(string salonId, string masterId, string serviceId)> FullSetupAsync(
        string date = "2026-05-04", bool autoApproveBookings = true) // Monday
    {
        var (salon, _) = await PostAsync<JsonElement>("/api/salons", new
        {
            name = $"BookSalon-{Guid.NewGuid()}", address = "Booking St",
            workingHoursStart = "09:00", workingHoursEnd = "18:00",
            workingDays = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" }
        });
        var (master, _) = await PostAsync<JsonElement>("/api/masters",
            new { email = $"test-{Guid.NewGuid():N}@test.com", firstName = "Book", lastName = "Master", phone = $"+7{Random.Shared.Next(1000000000, 1999999999)}", autoApproveBookings });
        var salonId = salon.GetProperty("id").GetString()!;
        var masterId = master.GetProperty("id").GetString()!;

        await PostAsync<JsonElement>($"/api/salons/{salonId}/masters", new
        {
            masterId, workingHoursStart = "09:00", workingHoursEnd = "18:00",
            workingDays = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" }
        });

        var (service, _) = await PostAsync<JsonElement>("/api/services",
            new { name = $"Svc-{Guid.NewGuid()}" });
        var serviceId = service.GetProperty("id").GetString()!;

        await PostAsync<JsonElement>($"/api/masters/{masterId}/services",
            new { serviceId, price = 2000, durationMinutes = 60 });

        // No need to generate legacy slots — availability is computed on-the-fly
        return (salonId, masterId, serviceId);
    }

    private object BookingBody(string salonId, string masterId, string serviceId,
        string date = "2026-05-04", string time = "10:00") => new
    {
        salonId, masterId, serviceIds = new[] { serviceId },
        clientName = "Test Client", clientPhone = "+79990001122",
        bookingDate = date, startTime = time
    };

    // ── POST /api/bookings ────────────────────────────────────────────────────

    [Fact]
    public async Task Create_Returns201_WithPriceAndStatus()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-04");

        var (result, status) = await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-04"));

        status.Should().Be(HttpStatusCode.Created);
        result.GetProperty("totalPrice").GetDecimal().Should().Be(2000);
        result.GetProperty("status").GetString().Should().Be("Confirmed");
        result.GetProperty("totalDurationMinutes").GetInt32().Should().Be(60);
    }

    [Fact]
    public async Task Create_Returns400_WhenNoSlotAvailable()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-05");

        // First booking takes 10:00 slot
        await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-05"));

        // Second booking tries same slot
        var response = await Client.PostAsJsonAsync("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-05"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_WhenMasterNotLinkedToSalon()
    {
        var (salon, _) = await PostAsync<JsonElement>("/api/salons", new
        {
            name = "Unlinked Salon", address = "X",
            workingHoursStart = "09:00", workingHoursEnd = "18:00",
            workingDays = new[] { "Monday" }
        });
        var (master, _) = await PostAsync<JsonElement>("/api/masters",
            new { email = $"test-{Guid.NewGuid():N}@test.com", firstName = "U", lastName = "U", phone = $"+7{Random.Shared.Next(1000000000, 1999999999)}" });
        var (service, _) = await PostAsync<JsonElement>("/api/services", new { name = "UX" });
        await PostAsync<JsonElement>($"/api/masters/{master.GetProperty("id")}/services",
            new { serviceId = service.GetProperty("id").GetString(), price = 100, durationMinutes = 30 });

        var response = await Client.PostAsJsonAsync("/api/bookings", new
        {
            salonId = salon.GetProperty("id").GetString(),
            masterId = master.GetProperty("id").GetString(),
            serviceIds = new[] { service.GetProperty("id").GetString() },
            clientName = "X", clientPhone = "+70000000000",
            bookingDate = "2026-05-11", startTime = "10:00"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_WhenValidationFails()
    {
        var response = await Client.PostAsJsonAsync("/api/bookings", new
        {
            // Missing required fields
            clientName = "X"
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── GET /api/bookings ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Returns200()
    {
        var response = await Client.GetAsync("/api/bookings");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_FiltersBySalon()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-06");
        await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-06"));

        var list = await GetAsync<List<JsonElement>>($"/api/bookings?salonId={salonId}");

        list!.Should().NotBeEmpty();
        list.Should().OnlyContain(b => b.GetProperty("salonId").GetString() == salonId);
    }

    // ── GET /api/bookings/{id} ────────────────────────────────────────────────

    [Fact]
    public async Task GetById_Returns200_WithServices()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-07");
        var (created, _) = await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-07"));
        var id = created.GetProperty("id").GetString();

        var result = await GetAsync<JsonElement>($"/api/bookings/{id}");

        result.GetProperty("services").GetArrayLength().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Returns404_ForUnknownId()
    {
        var response = await Client.GetAsync($"/api/bookings/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Full lifecycle: Create → Confirm → Cancel ─────────────────────────────

    [Fact]
    public async Task FullFlow_Create_Confirm_Cancel()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-11", autoApproveBookings: false);
        var (created, _) = await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-11"));
        var id = created.GetProperty("id").GetString();

        // Confirm
        var (confirmed, confirmStatus) = await PutAsync<JsonElement>($"/api/bookings/{id}/confirm");
        confirmStatus.Should().Be(HttpStatusCode.OK);
        confirmed!.GetProperty("status").GetString().Should().Be("Confirmed");

        // Cancel by client
        var (cancelled, cancelStatus) = await PutAsync<JsonElement>($"/api/bookings/{id}/cancel",
            new { side = "Client", reason = "Change of plans" });
        cancelStatus.Should().Be(HttpStatusCode.OK);
        cancelled!.GetProperty("status").GetString().Should().Be("CancelledByClient");
        cancelled.GetProperty("cancellationReason").GetString().Should().Be("Change of plans");
    }

    [Fact]
    public async Task Confirm_Returns400_WhenAlreadyConfirmed()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-12");
        var (created, _) = await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-12"));
        var id = created.GetProperty("id").GetString();
        await PutAsync<JsonElement>($"/api/bookings/{id}/confirm");

        var (_, status) = await PutAsync<JsonElement>($"/api/bookings/{id}/confirm");

        status.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Complete_Returns400_WhenBookingIsInFuture()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-13");
        var (created, _) = await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-13"));
        var id = created.GetProperty("id").GetString();
        await PutAsync<JsonElement>($"/api/bookings/{id}/confirm");

        var (_, status) = await PutAsync<JsonElement>($"/api/bookings/{id}/complete");

        status.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Cancel_Returns400_WhenInvalidSide()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-14");
        var (created, _) = await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-14"));
        var id = created.GetProperty("id").GetString();

        var response = await Client.PutAsJsonAsync($"/api/bookings/{id}/cancel",
            new { side = "Robot", reason = "Error" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Salon & Master sub-routes ──────────────────────────────────────────────

    [Fact]
    public async Task GetBySalon_Returns200_WithBookingsForSalon()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-18");
        await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-18"));

        var list = await GetAsync<List<JsonElement>>($"/api/salons/{salonId}/bookings");

        list!.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetByMaster_Returns200_WithBookingsForMaster()
    {
        var (salonId, masterId, serviceId) = await FullSetupAsync("2026-05-19");
        await PostAsync<JsonElement>("/api/bookings",
            BookingBody(salonId, masterId, serviceId, "2026-05-19"));

        var list = await GetAsync<List<JsonElement>>($"/api/masters/{masterId}/bookings");

        list!.Should().NotBeEmpty();
    }
}
