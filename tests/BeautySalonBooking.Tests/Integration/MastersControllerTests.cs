using System.Net;
using System.Text.Json;
using BeautySalonBooking.Tests.Integration.Setup;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Integration;

public class MastersControllerTests : IntegrationTestBase
{
    public MastersControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    private static object ValidMasterBody(string first = "Jane", string last = "Doe") => new
    {
        email = $"test-{Guid.NewGuid():N}@test.com", firstName = first, lastName = last, phone = "+70001112233"
    };

    // ── GET /api/masters ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Returns200()
    {
        var response = await Client.GetAsync("/api/masters");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── POST /api/masters ──────────────────────────────────────────────────────

    [Fact]
    public async Task Create_Returns201_WithValidData()
    {
        var (body, status) = await PostAsync<JsonElement>("/api/masters", ValidMasterBody("Anna", "Smith"));

        status.Should().Be(HttpStatusCode.Created);
        body.GetProperty("firstName").GetString().Should().Be("Anna");
        body.GetProperty("isDeleted").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Create_Returns400_WhenPhoneMissing()
    {
        var response = await Client.PostAsJsonAsync("/api/masters", new { email = "nophone@test.com", firstName = "X", lastName = "Y" });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── GET /api/masters/{id} ──────────────────────────────────────────────────

    [Fact]
    public async Task GetById_Returns200_WithAverageRating()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/masters", ValidMasterBody("Tom", "Jones"));
        var id = created.GetProperty("id").GetString();

        var detail = await GetAsync<JsonElement>($"/api/masters/{id}");

        detail.GetProperty("id").GetString().Should().Be(id);
        detail.TryGetProperty("averageRating", out _).Should().BeTrue();
        detail.GetProperty("ratingCount").GetInt32().Should().Be(0);
    }

    [Fact]
    public async Task GetById_Returns404_ForUnknownId()
    {
        var response = await Client.GetAsync($"/api/masters/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── PUT /api/masters/{id} ──────────────────────────────────────────────────

    [Fact]
    public async Task Update_Returns200_WithChangedName()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/masters", ValidMasterBody("Old", "Name"));
        var id = created.GetProperty("id").GetString();

        var (updated, status) = await PutAsync<JsonElement>($"/api/masters/{id}", new
        {
            description = "Updated description", autoApproveBookings = true
        });

        status.Should().Be(HttpStatusCode.OK);
        updated!.GetProperty("description").GetString().Should().Be("Updated description");
    }

    // ── DELETE /api/masters/{id} ───────────────────────────────────────────────

    [Fact]
    public async Task Delete_Returns204_AndMasterDisappearsFromList()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/masters", ValidMasterBody("Remove", "Me"));
        var id = created.GetProperty("id").GetString();

        var status = await DeleteAsync($"/api/masters/{id}");

        status.Should().Be(HttpStatusCode.NoContent);
        var list = await GetAsync<List<JsonElement>>("/api/masters");
        list!.Should().NotContain(e => e.GetProperty("id").GetString() == id);
    }

    // ── GET /api/masters/{id}/average-rating ──────────────────────────────────

    [Fact]
    public async Task GetAverageRating_Returns200_WithZeroWhenNoRatings()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/masters", ValidMasterBody("Rate", "Me"));
        var id = created.GetProperty("id").GetString();

        var result = await GetAsync<JsonElement>($"/api/masters/{id}/average-rating");

        result.GetProperty("average").GetDouble().Should().Be(0);
        result.GetProperty("count").GetInt32().Should().Be(0);
    }
}
