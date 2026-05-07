using System.Net.Http.Json;
using System.Text.Json;

namespace Bookio.Tests.Integration.Setup;

[Collection("Integration")]
public abstract class IntegrationTestBase
{
    protected readonly HttpClient Client;

    protected static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    protected IntegrationTestBase(CustomWebApplicationFactory factory)
    {
        Client = factory.CreateClient();
    }

    protected async Task<T?> GetAsync<T>(string url)
    {
        var response = await Client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>(JsonOpts);
    }

    protected async Task<(T? Body, System.Net.HttpStatusCode Status)> PostAsync<T>(string url, object body)
    {
        var response = await Client.PostAsJsonAsync(url, body);
        var content = await response.Content.ReadFromJsonAsync<T>(JsonOpts);
        return (content, response.StatusCode);
    }

    protected async Task<(T? Body, System.Net.HttpStatusCode Status)> PutAsync<T>(string url, object? body = null)
    {
        var response = body is null
            ? await Client.PutAsync(url, null)
            : await Client.PutAsJsonAsync(url, body);
        var content = response.IsSuccessStatusCode
            ? await response.Content.ReadFromJsonAsync<T>(JsonOpts)
            : default;
        return (content, response.StatusCode);
    }

    protected async Task<System.Net.HttpStatusCode> DeleteAsync(string url)
    {
        var response = await Client.DeleteAsync(url);
        return response.StatusCode;
    }
}
