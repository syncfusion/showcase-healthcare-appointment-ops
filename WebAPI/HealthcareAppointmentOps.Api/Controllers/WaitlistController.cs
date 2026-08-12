using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/waitlist")]
public class WaitlistController(IWaitlistService waitlistService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<WaitlistEntryDto>>>> List(
        [FromQuery] string? status,
        [FromQuery] Guid? departmentId,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var result = await waitlistService.ListAsync(status, departmentId, offset, limit, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/match")]
    public async Task<ActionResult<ApiResult<WaitlistEntryDto>>> Match(Guid id, [FromBody] MatchWaitlistRequest request, CancellationToken ct)
    {
        var result = await waitlistService.MatchAsync(id, request.AppointmentId, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        if (result.Status == "error")
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResult<bool>>> Remove(Guid id, CancellationToken ct)
    {
        var result = await waitlistService.RemoveAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }
}
