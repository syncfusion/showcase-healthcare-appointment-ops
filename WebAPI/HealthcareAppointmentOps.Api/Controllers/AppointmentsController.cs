using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/appointments")]
public class AppointmentsController(IAppointmentService appointmentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<AppointmentSummaryDto>>>> List(
        [FromQuery] Dictionary<string, string> filters,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var result = await appointmentService.ListAsync(filters, offset, limit, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResult<AppointmentDetailDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await appointmentService.GetByIdAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResult<AppointmentDetailDto>>> Create([FromBody] CreateAppointmentRequest request, CancellationToken ct)
    {
        var result = await appointmentService.CreateAsync(request, ct);
        if (result.Status == "error")
            return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data?.AppointmentId }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResult<AppointmentDetailDto>>> Update(Guid id, [FromBody] UpdateAppointmentRequest request, CancellationToken ct)
    {
        var result = await appointmentService.UpdateAsync(id, request, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        if (result.Status == "error")
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResult<AppointmentDetailDto>>> TransitionStatus(Guid id, [FromBody] StatusTransitionRequest request, CancellationToken ct)
    {
        var result = await appointmentService.TransitionStatusAsync(id, request.Status, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        if (result.Status == "error")
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApiResult<AppointmentDetailDto>>> Cancel(Guid id, [FromBody] CancelAppointmentRequest? request, CancellationToken ct)
    {
        var result = await appointmentService.CancelAsync(id, request?.CancellationReason, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        if (result.Status == "error")
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id:guid}/checkin")]
    public async Task<ActionResult<ApiResult<AppointmentDetailDto>>> CheckIn(Guid id, [FromBody] CheckInRequest? request, CancellationToken ct)
    {
        var result = await appointmentService.CheckInAsync(id, request?.CheckInSource, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        if (result.Status == "error")
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id:guid}/noshow")]
    public async Task<ActionResult<ApiResult<AppointmentDetailDto>>> NoShow(Guid id, CancellationToken ct)
    {
        var result = await appointmentService.MarkNoShowAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        if (result.Status == "error")
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("conflicts")]
    public async Task<ActionResult<ApiResult<List<ConflictDto>>>> GetConflicts(
        [FromQuery] Guid providerId,
        [FromQuery] DateTime scheduledDateTime,
        [FromQuery] int durationMinutes,
        [FromQuery] Guid? excludeAppointmentId,
        CancellationToken ct)
    {
        var result = await appointmentService.GetConflictsAsync(providerId, scheduledDateTime, durationMinutes, excludeAppointmentId, ct);
        return Ok(result);
    }
}
