using System.Net;
using System.Text.Json;
using Bookio.Tests.Integration.Setup;
using FluentAssertions;

namespace Bookio.Tests.Integration;

public class SalonsControllerTests : IntegrationTestBase
{
    public SalonsControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    private static object ValidSalonBody(string name = "Test Salon") => new
    {
        name,
        address = "10 Test Street",
        workingHoursStart = "09:00",
        workingHoursEnd = "21:00",
        workingDays = new[] { "Monday", "Wednesday", "Friday" }
    };

    // ── GET /api/salons ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Returns200()
    {
        var response = await Client.GetAsync("/api/salons");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_ReturnsArray()
    {
        var list = await GetAsync<List<JsonElement>>("/api/salons");
        list.Should().NotBeNull();
    }

    // ── POST /api/salons ──────────────────────────────────────────────────────

    [Fact]
    public async Task Create_Returns201_WithValidData()
    {
        var (body, status) = await PostAsync<JsonElement>("/api/salons", ValidSalonBody("Alpha Salon"));

        status.Should().Be(HttpStatusCode.Created);
        body.GetProperty("name").GetString().Should().Be("Alpha Salon");
        body.GetProperty("isActive").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Create_Returns400_WhenNameMissing()
    {
        var response = await Client.PostAsJsonAsync("/api/salons", new
        {
            address = "X", workingHoursStart = "09:00", workingHoursEnd = "21:00",
            workingDays = new[] { "Monday" }
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_WhenInvalidWorkingDay()
    {
        var response = await Client.PostAsJsonAsync("/api/salons", new
        {
            name = "X", address = "Y", workingHoursStart = "09:00", workingHoursEnd = "21:00",
            workingDays = new[] { "Funday" }
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── GET /api/salons/{id} ──────────────────────────────────────────────────

    [Fact]
    public async Task GetById_Returns200_ForExistingSalon()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/salons", ValidSalonBody("Beta Salon"));
        var id = created.GetProperty("id").GetString();

        var detail = await GetAsync<JsonElement>($"/api/salons/{id}");

        detail.GetProperty("id").GetString().Should().Be(id);
        detail.GetProperty("masters").GetArrayLength().Should().BeGreaterOrEqualTo(0);
    }

    [Fact]
    public async Task GetById_Returns404_ForUnknownId()
    {
        var response = await Client.GetAsync($"/api/salons/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── PUT /api/salons/{id} ──────────────────────────────────────────────────

    [Fact]
    public async Task Update_Returns200_WithChangedFields()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/salons", ValidSalonBody("Gamma"));
        var id = created.GetProperty("id").GetString();

        var (updated, status) = await PutAsync<JsonElement>($"/api/salons/{id}", new
        {
            name = "Gamma Renamed", address = "New Address",
            workingHoursStart = "10:00", workingHoursEnd = "20:00",
            workingDays = new[] { "Tuesday" }
        });

        status.Should().Be(HttpStatusCode.OK);
        updated!.GetProperty("name").GetString().Should().Be("Gamma Renamed");
    }

    [Fact]
    public async Task Update_Returns404_ForUnknownId()
    {
        var (_, status) = await PutAsync<JsonElement>($"/api/salons/{Guid.NewGuid()}", new
        {
            name = "X", address = "X",
            workingHoursStart = "09:00", workingHoursEnd = "21:00",
            workingDays = new[] { "Monday" }
        });
        status.Should().Be(HttpStatusCode.NotFound);
    }

    // ── DELETE /api/salons/{id} ────────────────────────────────────────────────

    [Fact]
    public async Task Delete_Returns204()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/salons", ValidSalonBody("ToDelete"));
        var id = created.GetProperty("id").GetString();

        var status = await DeleteAsync($"/api/salons/{id}");

        status.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_SoftDeletes_SalonDisappearsFromList()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/salons", ValidSalonBody("Disappear"));
        var id = created.GetProperty("id").GetString();
        await DeleteAsync($"/api/salons/{id}");

        var list = await GetAsync<List<JsonElement>>("/api/salons");
        list!.Should().NotContain(e => e.GetProperty("id").GetString() == id);
    }
}
