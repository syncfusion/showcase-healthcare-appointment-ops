using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using HealthcareAppointmentOps.Blazor.Models;

namespace HealthcareAppointmentOps.Blazor.Services;

public class ApiClient
{
    private readonly HttpClient _httpClient;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter() }
    };

    public ApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("X-Demo-Session", Guid.NewGuid().ToString());
    }

    public async Task<ApiResult<T>> GetJsonAsync<T>(string path, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.GetAsync(path, cancellationToken);
        return await ParseResponseAsync<T>(response, cancellationToken);
    }

    public async Task<ApiResult<T>> PostJsonAsync<T, B>(string path, B body, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PostAsJsonAsync(path, body, JsonOptions, cancellationToken);
        return await ParseResponseAsync<T>(response, cancellationToken);
    }

    public async Task<ApiResult<T>> PutJsonAsync<T, B>(string path, B body, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PutAsJsonAsync(path, body, JsonOptions, cancellationToken);
        return await ParseResponseAsync<T>(response, cancellationToken);
    }

    public async Task<ApiResult<T>> PatchJsonAsync<T, B>(string path, B body, CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, path)
        {
            Content = JsonContent.Create(body, typeof(B), options: JsonOptions)
        };
        var response = await _httpClient.SendAsync(request, cancellationToken);
        return await ParseResponseAsync<T>(response, cancellationToken);
    }

    public async Task<ApiResult<T>> DeleteAsync<T>(string path, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.DeleteAsync(path, cancellationToken);
        return await ParseResponseAsync<T>(response, cancellationToken);
    }

    private static async Task<ApiResult<T>> ParseResponseAsync<T>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var contentType = response.Content.Headers.ContentType?.MediaType;
        if (contentType != "application/json")
        {
            return new ApiResult<T>
            {
                Status = "error",
                Error = new ProblemDetails
                {
                    Title = "Invalid response",
                    Detail = "Expected JSON response from API"
                }
            };
        }

        var result = await response.Content.ReadFromJsonAsync<ApiResult<T>>(JsonOptions, cancellationToken);
        return result ?? new ApiResult<T>
        {
            Status = "error",
            Error = new ProblemDetails
            {
                Title = "Invalid response",
                Detail = "Could not deserialize API response"
            }
        };
    }
}
