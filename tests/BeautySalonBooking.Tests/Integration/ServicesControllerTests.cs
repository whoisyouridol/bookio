using System.Net;
using System.Text.Json;
using BeautySalonBooking.Tests.Integration.Setup;
using FluentAssertions;

namespace BeautySalonBooking.Tests.Integration;

public class ServicesControllerTests : IntegrationTestBase
{
    public ServicesControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task GetAll_Returns200()
    {
        var response = await Client.GetAsync("/api/services");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Create_Returns201_WithValidData()
    {
        var (body, status) = await PostAsync<JsonElement>("/api/services",
            new { name = "Gel Manicure", description = "Long-lasting" });

        status.Should().Be(HttpStatusCode.Created);
        body.GetProperty("name").GetString().Should().Be("Gel Manicure");
    }

    [Fact]
    public async Task Create_Returns400_WhenNameMissing()
    {
        var response = await Client.PostAsJsonAsync("/api/services", new { description = "x" });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_Returns200_WithNewName()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/services", new { name = "Old Svc" });
        var id = created.GetProperty("id").GetString();

        var (updated, status) = await PutAsync<JsonElement>($"/api/services/{id}",
            new { name = "New Svc", description = (string?)null });

        status.Should().Be(HttpStatusCode.OK);
        updated!.GetProperty("name").GetString().Should().Be("New Svc");
    }

    [Fact]
    public async Task Delete_Returns204_AndServiceGone()
    {
        var (created, _) = await PostAsync<JsonElement>("/api/services", new { name = "DeleteMe" });
        var id = created.GetProperty("id").GetString();

        var status = await DeleteAsync($"/api/services/{id}");

        status.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_Returns404_ForUnknownId()
    {
        var status = await DeleteAsync($"/api/services/{Guid.NewGuid()}");
        status.Should().Be(HttpStatusCode.NotFound);
    }
}
