using System.Net;
using System.Text.Json;
using Bookio.Tests.Integration.Setup;
using FluentAssertions;

namespace Bookio.Tests.Integration;

public class MasterServicesControllerTests : IntegrationTestBase
{
    public MasterServicesControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    private async Task<(string masterId, string serviceId)> CreateMasterAndServiceAsync()
    {
        var (master, _) = await PostAsync<JsonElement>("/api/masters",
            new { email = $"test-{Guid.NewGuid():N}@test.com", firstName = "MS", lastName = "Test", phone = $"+7{Random.Shared.Next(1000000000, 1999999999)}" });
        var (service, _) = await PostAsync<JsonElement>("/api/services",
            new { name = $"Svc-{Guid.NewGuid()}" });
        return (master.GetProperty("id").GetString()!, service.GetProperty("id").GetString()!);
    }

    [Fact]
    public async Task Add_Returns200_WithPriceAndDuration()
    {
        var (masterId, serviceId) = await CreateMasterAndServiceAsync();

        var (result, status) = await PostAsync<JsonElement>($"/api/masters/{masterId}/services", new
        {
            serviceId, price = 1200, durationMinutes = 45
        });

        status.Should().Be(HttpStatusCode.OK);
        result.GetProperty("price").GetDecimal().Should().Be(1200);
        result.GetProperty("durationMinutes").GetInt32().Should().Be(45);
    }

    [Fact]
    public async Task Add_Returns400_WhenMasterNotFound()
    {
        var (_, serviceId) = await CreateMasterAndServiceAsync();
        var response = await Client.PostAsJsonAsync($"/api/masters/{Guid.NewGuid()}/services",
            new { serviceId, price = 100, durationMinutes = 30 });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Add_Returns400_WhenPriceIsZero()
    {
        var (masterId, serviceId) = await CreateMasterAndServiceAsync();
        var response = await Client.PostAsJsonAsync($"/api/masters/{masterId}/services",
            new { serviceId, price = 0, durationMinutes = 30 });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_Returns200_WithNewPrice()
    {
        var (masterId, serviceId) = await CreateMasterAndServiceAsync();
        await PostAsync<JsonElement>($"/api/masters/{masterId}/services",
            new { serviceId, price = 1000, durationMinutes = 60 });

        var (result, status) = await PutAsync<JsonElement>($"/api/masters/{masterId}/services/{serviceId}",
            new { price = 2500, durationMinutes = 90 });

        status.Should().Be(HttpStatusCode.OK);
        result!.GetProperty("price").GetDecimal().Should().Be(2500);
    }

    [Fact]
    public async Task Remove_Returns204()
    {
        var (masterId, serviceId) = await CreateMasterAndServiceAsync();
        await PostAsync<JsonElement>($"/api/masters/{masterId}/services",
            new { serviceId, price = 800, durationMinutes = 30 });

        var status = await DeleteAsync($"/api/masters/{masterId}/services/{serviceId}");

        status.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Remove_Returns404_WhenNotFound()
    {
        var status = await DeleteAsync($"/api/masters/{Guid.NewGuid()}/services/{Guid.NewGuid()}");
        status.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetServices_Returns200_ForMaster()
    {
        var (masterId, serviceId) = await CreateMasterAndServiceAsync();
        await PostAsync<JsonElement>($"/api/masters/{masterId}/services",
            new { serviceId, price = 500, durationMinutes = 30 });

        var list = await GetAsync<List<JsonElement>>($"/api/masters/{masterId}/services");

        list.Should().HaveCountGreaterOrEqualTo(1);
    }
}
