using HealthcareAppointmentOps.Blazor.Models;
using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Services;

public class ReferenceDataService
{
    private readonly ApiClient _apiClient;

    public ReferenceDataService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<ApiResult<List<DepartmentDto>>> GetDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<List<DepartmentDto>>("api/v1/departments", cancellationToken);
    }

    public async Task<ApiResult<List<LocationDto>>> GetLocationsAsync(CancellationToken cancellationToken = default)
    {
        return await _apiClient.GetJsonAsync<List<LocationDto>>("api/v1/locations", cancellationToken);
    }
}
