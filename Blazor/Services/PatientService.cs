using HealthcareAppointmentOps.Blazor.Models;
using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Services;

public class PatientService
{
    private readonly ApiClient _apiClient;

    public PatientService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<ApiResult<PagedResult<PatientSummaryDto>>> GetPatientsAsync(
        PagingRequest paging,
        SortingRequest? sorting = null,
        PatientFilterRequest? filter = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(paging, sorting, filter, search);
        return await _apiClient.GetJsonAsync<PagedResult<PatientSummaryDto>>("api/v1/patients" + query, cancellationToken);
    }

    public async Task<ApiResult<PagedResult<PatientSummaryDto>>> SearchPatientsAsync(string search, int limit = 25, CancellationToken cancellationToken = default)
    {
        var query = $"?q={Uri.EscapeDataString(search)}&offset=0&limit={limit}";
        return await _apiClient.GetJsonAsync<PagedResult<PatientSummaryDto>>("api/v1/patients" + query, cancellationToken);
    }

    public async Task<ApiResult<PatientDetailDto>> GetPatientAsync(string patientId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<PatientDetailDto>($"api/v1/patients/{patientId}", cancellationToken);
    }

    public async Task<ApiResult<ClinicalHistoryDto>> GetPatientClinicalHistoryAsync(string patientId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<ClinicalHistoryDto>($"api/v1/patients/{patientId}/clinical-history", cancellationToken);
    }

    public async Task<ApiResult<MedicationHistoryDto>> GetPatientMedicationsAsync(string patientId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<MedicationHistoryDto>($"api/v1/patients/{patientId}/medications", cancellationToken);
    }

    public async Task<ApiResult<List<DocumentDto>>> GetPatientDocumentsAsync(string patientId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<List<DocumentDto>>($"api/v1/patients/{patientId}/documents", cancellationToken);
    }

    public async Task<ApiResult<CarePlanDto>> GetPatientCarePlanAsync(string patientId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<CarePlanDto>($"api/v1/patients/{patientId}/care-plan", cancellationToken);
    }

    private static string BuildQuery(PagingRequest paging, SortingRequest? sorting, PatientFilterRequest? filter, string? search)
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

        if (filter is not null)
        {
            if (!string.IsNullOrWhiteSpace(filter.Search))
                parameters.Add($"q={Uri.EscapeDataString(filter.Search)}");
            if (!string.IsNullOrWhiteSpace(filter.Gender))
                parameters.Add($"gender={Uri.EscapeDataString(filter.Gender)}");
            if (!string.IsNullOrWhiteSpace(filter.Status))
                parameters.Add($"status={Uri.EscapeDataString(filter.Status)}");
            if (!string.IsNullOrWhiteSpace(filter.ProviderId))
                parameters.Add($"providerId={Uri.EscapeDataString(filter.ProviderId)}");
        }

        if (!string.IsNullOrWhiteSpace(search))
            parameters.Add($"q={Uri.EscapeDataString(search)}");

        return "?" + string.Join("&", parameters);
    }
}
