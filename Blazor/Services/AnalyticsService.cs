using HealthcareAppointmentOps.Blazor.Models;
using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Services;

public class AnalyticsService
{
    private readonly ApiClient _apiClient;

    public AnalyticsService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<ApiResult<DashboardKpiDto>> GetDashboardKpisAsync(string? period = null, CancellationToken cancellationToken = default)
    {
        var query = string.IsNullOrWhiteSpace(period)
            ? string.Empty
            : $"?period={Uri.EscapeDataString(period)}";
        return await _apiClient.GetJsonAsync<DashboardKpiDto>($"api/v1/analytics/dashboard{query}", cancellationToken);
    }

    public async Task<ApiResult<List<VolumeDataPointDto>>> GetAppointmentVolumeAsync(string startDate, string endDate, CancellationToken cancellationToken = default)
    {
        var query = $"?startDate={Uri.EscapeDataString(startDate)}&endDate={Uri.EscapeDataString(endDate)}";
        return await _apiClient.GetJsonAsync<List<VolumeDataPointDto>>($"api/v1/analytics/appointment-volume{query}", cancellationToken);
    }

    public async Task<ApiResult<List<UtilizationDataPointDto>>> GetProviderUtilizationAsync(string startDate, string endDate, string? providerId = null, string? departmentId = null, CancellationToken cancellationToken = default)
    {
        var parameters = new List<string>
        {
            $"startDate={Uri.EscapeDataString(startDate)}",
            $"endDate={Uri.EscapeDataString(endDate)}"
        };
        if (!string.IsNullOrWhiteSpace(providerId))
            parameters.Add($"providerId={Uri.EscapeDataString(providerId)}");
        if (!string.IsNullOrWhiteSpace(departmentId))
            parameters.Add($"departmentId={Uri.EscapeDataString(departmentId)}");
        return await _apiClient.GetJsonAsync<List<UtilizationDataPointDto>>($"api/v1/analytics/provider-utilization?{string.Join("&", parameters)}", cancellationToken);
    }

    public async Task<ApiResult<List<NoShowTrendDto>>> GetNoShowTrendsAsync(string startDate, string endDate, string? departmentId = null, CancellationToken cancellationToken = default)
    {
        var parameters = new List<string>
        {
            $"startDate={Uri.EscapeDataString(startDate)}",
            $"endDate={Uri.EscapeDataString(endDate)}"
        };
        if (!string.IsNullOrWhiteSpace(departmentId))
            parameters.Add($"departmentId={Uri.EscapeDataString(departmentId)}");
        return await _apiClient.GetJsonAsync<List<NoShowTrendDto>>($"api/v1/analytics/no-show-trends?{string.Join("&", parameters)}", cancellationToken);
    }

    public async Task<ApiResult<List<CancellationReasonDto>>> GetCancellationReasonsAsync(string startDate, string endDate, string? departmentId = null, CancellationToken cancellationToken = default)
    {
        var parameters = new List<string>
        {
            $"startDate={Uri.EscapeDataString(startDate)}",
            $"endDate={Uri.EscapeDataString(endDate)}"
        };
        if (!string.IsNullOrWhiteSpace(departmentId))
            parameters.Add($"departmentId={Uri.EscapeDataString(departmentId)}");
        return await _apiClient.GetJsonAsync<List<CancellationReasonDto>>($"api/v1/analytics/cancellation-reasons?{string.Join("&", parameters)}", cancellationToken);
    }
}
