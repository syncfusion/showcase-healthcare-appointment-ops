using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/audit-log")]
public class AuditLogController(IAuditLogService auditLogService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<AuditLogEntryDto>>>> List(
        [FromQuery] string? entityType,
        [FromQuery] Guid? entityId,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var result = await auditLogService.ListAsync(entityType, entityId, offset, limit, ct);
        return Ok(result);
    }
}
