using System.Net;
using System.Text.Json;
using Bookio.Tests.Integration.Setup;
using FluentAssertions;

namespace Bookio.Tests.Integration;

public class SalonMastersControllerTests : IntegrationTestBase
{
    public SalonMastersControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    private async Task<(string salonId, string masterId)> CreateSalonAndMasterAsync()
    {
        var (salon, _) = await PostAsync<JsonElement>("/api/salons", new
        {
            name = $"Salon-{Guid.NewGuid()}", address = "St. 1",
            workingHoursStart = "09:00", workingHoursEnd = "21:00",
            workingDays = new[] { "Monday", "Tuesday" }
        });
        var (master, _) = await PostAsync<JsonElement>("/api/masters", new
        {
            email = $"test-{Guid.NewGuid():N}@test.com", firstName = "Link", lastName = "Test", phone = $"+7{Random.Shared.Next(1000000000, 1999999999)}"
        });
        return (salon.GetProperty("id").GetString()!, master.GetProperty("id").GetString()!);
    }

    [Fact]
    public async Task Link_Returns200_WhenBothExist()
    {
        var (salonId, masterId) = await CreateSalonAndMasterAsync();

        var (result, status) = await PostAsync<JsonElement>($"/api/salons/{salonId}/masters", new
        {
            masterId
        });

        status.Should().Be(HttpStatusCode.OK);
        result.GetProperty("salonId").GetString().Should().Be(salonId);
        result.GetProperty("masterId").GetString().Should().Be(masterId);
    }

    [Fact]
    public async Task Link_Returns400_WhenAlreadyLinked()
    {
        var (salonId, masterId) = await CreateSalonAndMasterAsync();
        var linkBody = new { masterId };

        await PostAsync<JsonElement>($"/api/salons/{salonId}/masters", linkBody);
        var response = await Client.PostAsJsonAsync($"/api/salons/{salonId}/masters", linkBody);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Link_Returns400_WhenSalonNotFound()
    {
        var (_, masterId) = await CreateSalonAndMasterAsync();

        var response = await Client.PostAsJsonAsync($"/api/salons/{Guid.NewGuid()}/masters", new
        {
            masterId
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Unlink_Returns204()
    {
        var (salonId, masterId) = await CreateSalonAndMasterAsync();
        await PostAsync<JsonElement>($"/api/salons/{salonId}/masters", new { masterId });

        var status = await DeleteAsync($"/api/salons/{salonId}/masters/{masterId}");

        status.Should().Be(HttpStatusCode.NoContent);
    }
}
