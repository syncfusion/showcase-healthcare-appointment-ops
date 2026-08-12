using HealthcareAppointmentOps.Blazor.Models;
using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Services;

public class ProviderService
{
    private readonly ApiClient _apiClient;

    public ProviderService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<ApiResult<PagedResult<ProviderSummaryDto>>> GetProvidersAsync(
        PagingRequest paging,
        SortingRequest? sorting = null,
        string? departmentId = null,
        string? specialty = null,
        CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(paging, sorting, departmentId, specialty);
        return await _apiClient.GetJsonAsync<PagedResult<ProviderSummaryDto>>("api/v1/providers" + query, cancellationToken);
    }

    public async Task<ApiResult<List<ProviderSummaryDto>>> GetProvidersAsync(CancellationToken cancellationToken = default)
    {
        var result = await _apiClient.GetJsonAsync<PagedResult<ProviderSummaryDto>>("api/v1/providers?limit=500&offset=0", cancellationToken);
        if (result.IsOk && result.Data is not null)
            return new ApiResult<List<ProviderSummaryDto>> { Status = "ok", Data = result.Data.Items };
        return new ApiResult<List<ProviderSummaryDto>> { Status = "error", Error = result.Error ?? new ProblemDetails { Title = "Failed to load providers" } };
    }

    public async Task<ApiResult<ProviderDetailDto>> GetProviderAsync(string providerId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<ProviderDetailDto>($"api/v1/providers/{providerId}", cancellationToken);
    }

    public async Task<ApiResult<List<ScheduleTemplateDto>>> GetScheduleTemplatesAsync(string providerId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<List<ScheduleTemplateDto>>($"api/v1/providers/{providerId}/templates", cancellationToken);
    }

    public async Task<ApiResult<List<SlotDto>>> GetAvailableSlotsAsync(
        string providerId,
        string date,
        CancellationToken cancellationToken = default)
    {
        var query = $"?date={Uri.EscapeDataString(date)}";
        return await _apiClient.GetJsonAsync<List<SlotDto>>($"api/v1/providers/{providerId}/availability{query}", cancellationToken);
    }

    private static string BuildQuery(PagingRequest paging, SortingRequest? sorting, string? departmentId, string? specialty)
    {
        var parameters = new List<string>
        {
            $"offset={paging.Offset}",
            $"limit={paging.Limit}"
        };

        if (sorting is not null)
        {
            parameters.Add($"sortBy={Uri.EscapeDataString(sorting.SortBy)}");
            parameters.Add($"descending={sorting.Descending}");
        }

        if (!string.IsNullOrWhiteSpace(departmentId))
            parameters.Add($"departmentId={Uri.EscapeDataString(departmentId)}");

        if (!string.IsNullOrWhiteSpace(specialty))
            parameters.Add($"specialty={Uri.EscapeDataString(specialty)}");

        return "?" + string.Join("&", parameters);
    }
}
