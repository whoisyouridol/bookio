using System.Net;
using System.Text.Json;
using BeautySalonBooking.Tests.Integration.Setup;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Integration;

public class TimeSlotsControllerTests : IntegrationTestBase
{
    public TimeSlotsControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    // Creates salon → master → link, returns salonId + masterId
    private async Task<(string salonId, string masterId)> SetupSalonMasterAsync()
    {
        var (salon, _) = await PostAsync<JsonElement>("/api/salons", new
        {
            name = $"Salon-{Guid.NewGuid()}", address = "A",
            workingHoursStart = "09:00", workingHoursEnd = "18:00",
            workingDays = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" }
        });
        var (master, _) = await PostAsync<JsonElement>("/api/masters",
            new { email = $"test-{Guid.NewGuid():N}@test.com", firstName = "Slot", lastName = "Tester", phone = $"+7{Random.Shared.Next(1000000000, 1999999999)}" });
        var salonId = salon.GetProperty("id").GetString()!;
        var masterId = master.GetProperty("id").GetString()!;

        await PostAsync<JsonElement>($"/api/salons/{salonId}/masters", new
        {
            masterId, workingHoursStart = "09:00", workingHoursEnd = "18:00",
            workingDays = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" }
        });
        return (salonId, masterId);
    }

    // ── Generate ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Generate_Returns200_WithCount()
    {
        var (salonId, masterId) = await SetupSalonMasterAsync();

        var (result, status) = await PostAsync<JsonElement>(
            $"/api/salons/{salonId}/masters/{masterId}/slots/generate", new
            {
                startDate = "2026-04-07", // Monday
                endDate = "2026-04-07",
                slotDurationMinutes = 60
            });

        status.Should().Be(HttpStatusCode.OK);
        result.GetProperty("generated").GetInt32().Should().Be(9); // 09:00-18:00 / 60 min
    }

    [Fact]
    public async Task Generate_Returns400_WhenLinkNotFound()
    {
        var response = await Client.PostAsJsonAsync(
            $"/api/salons/{Guid.NewGuid()}/masters/{Guid.NewGuid()}/slots/generate", new
            {
                startDate = "2026-04-07", endDate = "2026-04-07", slotDurationMinutes = 60
            });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── GetAvailable ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAvailable_Returns200_WithSlots()
    {
        var (salonId, masterId) = await SetupSalonMasterAsync();
        await PostAsync<JsonElement>($"/api/salons/{salonId}/masters/{masterId}/slots/generate",
            new { startDate = "2026-04-13", endDate = "2026-04-13", slotDurationMinutes = 60 }); // Monday

        var list = await GetAsync<List<JsonElement>>(
            $"/api/salons/{salonId}/masters/{masterId}/slots?date=2026-04-13");

        list.Should().NotBeEmpty();
        list![0].GetProperty("status").GetString().Should().Be("Available");
    }

    [Fact]
    public async Task GetAvailable_Returns400_WhenInvalidDate()
    {
        var (salonId, masterId) = await SetupSalonMasterAsync();
        var response = await Client.GetAsync(
            $"/api/salons/{salonId}/masters/{masterId}/slots?date=not-a-date");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── CreateBatch ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBatch_Returns200_WithCreatedSlots()
    {
        var (salonId, masterId) = await SetupSalonMasterAsync();

        var (result, status) = await PostAsync<List<JsonElement>>(
            $"/api/salons/{salonId}/masters/{masterId}/slots", new
            {
                date = "2026-04-20",
                slots = new[]
                {
                    new { startTime = "09:00", endTime = "10:00" },
                    new { startTime = "10:00", endTime = "11:00" }
                }
            });

        status.Should().Be(HttpStatusCode.OK);
        result.Should().HaveCount(2);
    }

    // ── UpdateStatus ──────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStatus_Returns200_WithNewStatus()
    {
        var (salonId, masterId) = await SetupSalonMasterAsync();
        // Use CreateBatch to get real DB slot IDs (GetAvailable returns computed virtual slots)
        var (slots, _) = await PostAsync<List<JsonElement>>(
            $"/api/salons/{salonId}/masters/{masterId}/slots", new
            {
                date = "2026-04-21",
                slots = new[] { new { startTime = "09:00", endTime = "10:00" } }
            });
        var slotId = slots![0].GetProperty("id").GetString();

        var (updated, status) = await PutAsync<JsonElement>($"/api/slots/{slotId}",
            new { status = "Blocked" });

        status.Should().Be(HttpStatusCode.OK);
        updated!.GetProperty("status").GetString().Should().Be("Blocked");
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_Returns204()
    {
        var (salonId, masterId) = await SetupSalonMasterAsync();
        // Use CreateBatch to get real DB slot IDs
        var (slots, _) = await PostAsync<List<JsonElement>>(
            $"/api/salons/{salonId}/masters/{masterId}/slots", new
            {
                date = "2026-04-22",
                slots = new[] { new { startTime = "09:00", endTime = "10:00" } }
            });
        var slotId = slots![0].GetProperty("id").GetString();

        var status = await DeleteAsync($"/api/slots/{slotId}");

        status.Should().Be(HttpStatusCode.NoContent);
    }
}
