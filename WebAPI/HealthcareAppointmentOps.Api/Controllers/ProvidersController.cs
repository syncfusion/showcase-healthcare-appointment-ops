using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/providers")]
public class ProvidersController(IProviderService providerService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<ProviderSummaryDto>>>> List(
        [FromQuery] Guid? departmentId,
        [FromQuery] string? specialty,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var result = await providerService.ListAsync(departmentId, specialty, offset, limit, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResult<ProviderDetailDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await providerService.GetByIdAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id:guid}/availability")]
    public async Task<ActionResult<ApiResult<List<SlotDto>>>> GetAvailability(Guid id, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var result = await providerService.GetAvailabilityAsync(id, date, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/templates")]
    public async Task<ActionResult<ApiResult<List<ScheduleTemplateDto>>>> GetTemplates(Guid id, CancellationToken ct)
    {
        var result = await providerService.GetTemplatesAsync(id, ct);
        return Ok(result);
    }
}
