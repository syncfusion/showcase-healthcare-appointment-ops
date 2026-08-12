using HealthcareAppointmentOps.Blazor.Models;
using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Services;

public class WaitlistService
{
    private readonly ApiClient _apiClient;

    public WaitlistService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<ApiResult<PagedResult<WaitlistEntryDto>>> GetWaitlistAsync(
        string? status = null,
        string? departmentId = null,
        int offset = 0,
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(status, departmentId, offset, limit);
        return await _apiClient.GetJsonAsync<PagedResult<WaitlistEntryDto>>("api/v1/waitlist" + query, cancellationToken);
    }

    public async Task<ApiResult<WaitlistEntryDto>> MatchEntryAsync(string waitlistId, string appointmentId, CancellationToken cancellationToken = default)
    {
        var request = new MatchWaitlistRequest { AppointmentId = appointmentId };
        return await _apiClient.PostJsonAsync<WaitlistEntryDto, MatchWaitlistRequest>($"api/v1/waitlist/{waitlistId}/match", request, cancellationToken);
    }

    public async Task<ApiResult<bool>> RemoveEntryAsync(string waitlistId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.DeleteAsync<bool>($"api/v1/waitlist/{waitlistId}", cancellationToken);
    }

    private static string BuildQuery(string? status, string? departmentId, int offset, int limit)
    {
        var parameters = new List<string>
        {
            $"offset={offset}",
            $"limit={limit}"
        };

        if (!string.IsNullOrWhiteSpace(status))
            parameters.Add($"status={Uri.EscapeDataString(status)}");

        if (!string.IsNullOrWhiteSpace(departmentId))
            parameters.Add($"departmentId={Uri.EscapeDataString(departmentId)}");

        return "?" + string.Join("&", parameters);
    }
}
