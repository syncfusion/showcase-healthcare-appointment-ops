using HealthcareAppointmentOps.Blazor.Models;
using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Services;

public class AuditLogService
{
    private readonly ApiClient _apiClient;

    public AuditLogService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<ApiResult<PagedResult<AuditLogDto>>> GetAuditLogsAsync(
        string? entityType = null,
        string? entityId = null,
        PagingRequest? paging = null,
        CancellationToken cancellationToken = default)
    {
        paging ??= new PagingRequest();
        var parameters = new List<string>
        {
            $"offset={paging.Offset}",
            $"limit={paging.Limit}"
        };

        if (!string.IsNullOrWhiteSpace(entityType))
            parameters.Add($"entityType={Uri.EscapeDataString(entityType)}");
        if (!string.IsNullOrWhiteSpace(entityId))
            parameters.Add($"entityId={Uri.EscapeDataString(entityId)}");

        var query = "?" + string.Join("&", parameters);
        return await _apiClient.GetJsonAsync<PagedResult<AuditLogDto>>("api/v1/audit-log" + query, cancellationToken);
    }
}
