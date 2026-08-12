using HealthcareAppointmentOps.Blazor.Models;
using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Services;

public class AppointmentService
{
    private readonly ApiClient _apiClient;

    public AppointmentService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<ApiResult<PagedResult<AppointmentSummaryDto>>> GetAppointmentsAsync(
        AppointmentFilterRequest? filter = null,
        PagingRequest? paging = null,
        CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(filter, paging);
        return await _apiClient.GetJsonAsync<PagedResult<AppointmentSummaryDto>>("api/v1/appointments" + query, cancellationToken);
    }

    public async Task<ApiResult<AppointmentDetailDto>> GetAppointmentAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<AppointmentDetailDto>($"api/v1/appointments/{appointmentId}", cancellationToken);
    }

    public async Task<ApiResult<AppointmentDetailDto>> CreateAppointmentAsync(CreateAppointmentRequest request, CancellationToken cancellationToken = default)
    {
        return await _apiClient.PostJsonAsync<AppointmentDetailDto, CreateAppointmentRequest>("api/v1/appointments", request, cancellationToken);
    }

    public async Task<ApiResult<AppointmentDetailDto>> TransitionStatusAsync(string appointmentId, AppointmentStatus status, CancellationToken cancellationToken = default)
    {
        return await _apiClient.PatchJsonAsync<AppointmentDetailDto, StatusTransitionRequest>(
            $"api/v1/appointments/{appointmentId}/status",
            new StatusTransitionRequest { Status = status },
            cancellationToken);
    }

    public async Task<ApiResult<AppointmentDetailDto>> CheckInAsync(string appointmentId, string? source = null, CancellationToken cancellationToken = default)
    {
        return await _apiClient.PostJsonAsync<AppointmentDetailDto, object?>($"api/v1/appointments/{appointmentId}/checkin", new { checkInSource = source }, cancellationToken);
    }

    public async Task<ApiResult<AppointmentDetailDto>> CancelAsync(string appointmentId, string? reason = null, CancellationToken cancellationToken = default)
    {
        return await _apiClient.PostJsonAsync<AppointmentDetailDto, object?>($"api/v1/appointments/{appointmentId}/cancel", new { cancellationReason = reason }, cancellationToken);
    }

    public async Task<ApiResult<AppointmentDetailDto>> NoShowAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.PostJsonAsync<AppointmentDetailDto, object?>($"api/v1/appointments/{appointmentId}/noshow", null, cancellationToken);
    }

    public async Task<ApiResult<List<ConflictDto>>> GetConflictsAsync(
        string providerId,
        string scheduledDateTime,
        int durationMinutes,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default)
    {
        var parameters = new List<string>
        {
            $"providerId={Uri.EscapeDataString(providerId)}",
            $"scheduledDateTime={Uri.EscapeDataString(scheduledDateTime)}",
            $"durationMinutes={durationMinutes}"
        };
        if (!string.IsNullOrWhiteSpace(excludeAppointmentId))
            parameters.Add($"excludeAppointmentId={Uri.EscapeDataString(excludeAppointmentId)}");
        return await _apiClient.GetJsonAsync<List<ConflictDto>>("api/v1/appointments/conflicts?" + string.Join("&", parameters), cancellationToken);
    }

    private static string BuildQuery(AppointmentFilterRequest? filter, PagingRequest? paging)
    {
        var parameters = new List<string>();

        paging ??= new PagingRequest();
        parameters.Add($"offset={paging.Offset}");
        parameters.Add($"limit={paging.Limit}");

        if (filter is not null)
        {
            if (!string.IsNullOrWhiteSpace(filter.Status))
                parameters.Add($"status={Uri.EscapeDataString(filter.Status)}");
            if (!string.IsNullOrWhiteSpace(filter.ProviderId))
                parameters.Add($"providerId={Uri.EscapeDataString(filter.ProviderId)}");
            if (!string.IsNullOrWhiteSpace(filter.DepartmentId))
                parameters.Add($"departmentId={Uri.EscapeDataString(filter.DepartmentId)}");
            if (!string.IsNullOrWhiteSpace(filter.PatientId))
                parameters.Add($"patientId={Uri.EscapeDataString(filter.PatientId)}");
            if (!string.IsNullOrWhiteSpace(filter.FromDate))
                parameters.Add($"dateFrom={Uri.EscapeDataString(filter.FromDate)}");
            if (!string.IsNullOrWhiteSpace(filter.ToDate))
                parameters.Add($"dateTo={Uri.EscapeDataString(filter.ToDate)}");
        }

        return "?" + string.Join("&", parameters);
    }
}
