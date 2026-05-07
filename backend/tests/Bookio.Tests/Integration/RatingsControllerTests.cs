using System.Net;
using System.Text.Json;
using Bookio.Tests.Integration.Setup;
using FluentAssertions;

namespace Bookio.Tests.Integration;

public class RatingsControllerTests : IntegrationTestBase
{
    public RatingsControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    private async Task<string> CreateMasterAsync()
    {
        var (master, _) = await PostAsync<JsonElement>("/api/masters",
            new { email = $"test-{Guid.NewGuid():N}@test.com", firstName = "Rate", lastName = "Me", phone = $"+7{Random.Shared.Next(1000000000, 1999999999)}" });
        return master.GetProperty("id").GetString()!;
    }

    // ── POST /api/masters/{id}/ratings ────────────────────────────────────────

    [Fact]
    public async Task Create_Returns200_WithValidRating()
    {
        var masterId = await CreateMasterAsync();

        var (result, status) = await PostAsync<JsonElement>($"/api/masters/{masterId}/ratings",
            new { clientName = "Happy Client", rating = 5, comment = "Fantastic!" });

        status.Should().Be(HttpStatusCode.OK);
        result.GetProperty("rating").GetInt32().Should().Be(5);
        result.GetProperty("clientName").GetString().Should().Be("Happy Client");
    }

    [Fact]
    public async Task Create_Returns400_WhenRatingOutOfRange()
    {
        var masterId = await CreateMasterAsync();

        var response = await Client.PostAsJsonAsync($"/api/masters/{masterId}/ratings",
            new { clientName = "X", rating = 6 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_WhenRatingTooLow()
    {
        var masterId = await CreateMasterAsync();

        var response = await Client.PostAsJsonAsync($"/api/masters/{masterId}/ratings",
            new { clientName = "X", rating = 0 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_WhenMasterNotFound()
    {
        var response = await Client.PostAsJsonAsync($"/api/masters/{Guid.NewGuid()}/ratings",
            new { clientName = "X", rating = 4 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── GET /api/masters/{id}/ratings ─────────────────────────────────────────

    [Fact]
    public async Task GetByMaster_Returns200_WithRatings()
    {
        var masterId = await CreateMasterAsync();
        await PostAsync<JsonElement>($"/api/masters/{masterId}/ratings",
            new { clientName = "A", rating = 4 });
        await PostAsync<JsonElement>($"/api/masters/{masterId}/ratings",
            new { clientName = "B", rating = 3 });

        var list = await GetAsync<List<JsonElement>>($"/api/masters/{masterId}/ratings");

        list!.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetByMaster_Returns200_WithEmpty_WhenNoRatings()
    {
        var masterId = await CreateMasterAsync();
        var list = await GetAsync<List<JsonElement>>($"/api/masters/{masterId}/ratings");
        list!.Should().BeEmpty();
    }

    // ── GET /api/masters/{id}/average-rating ──────────────────────────────────

    [Fact]
    public async Task AverageRating_ReflectsSubmittedRatings()
    {
        var masterId = await CreateMasterAsync();
        await PostAsync<JsonElement>($"/api/masters/{masterId}/ratings",
            new { clientName = "A", rating = 4 });
        await PostAsync<JsonElement>($"/api/masters/{masterId}/ratings",
            new { clientName = "B", rating = 2 });

        var result = await GetAsync<JsonElement>($"/api/masters/{masterId}/average-rating");

        result.GetProperty("average").GetDouble().Should().Be(3);
        result.GetProperty("count").GetInt32().Should().Be(2);
    }

    // ── DELETE /api/ratings/{id} ──────────────────────────────────────────────

    [Fact]
    public async Task Delete_Returns204()
    {
        var masterId = await CreateMasterAsync();
        var (created, _) = await PostAsync<JsonElement>($"/api/masters/{masterId}/ratings",
            new { clientName = "ToDelete", rating = 3 });
        var id = created.GetProperty("id").GetString();

        var status = await DeleteAsync($"/api/ratings/{id}");

        status.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_Returns404_WhenNotFound()
    {
        var status = await DeleteAsync($"/api/ratings/{Guid.NewGuid()}");
        status.Should().Be(HttpStatusCode.NotFound);
    }
}
