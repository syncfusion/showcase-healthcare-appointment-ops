using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/ai")]
public class AiController(IAiService aiService, IDocumentService documentService) : ControllerBase
{
    [HttpPost("schedule-optimization")]
    public async Task<ActionResult<ApiResult<ScheduleOptimizationDto>>> OptimizeSchedule(
        [FromBody] ScheduleOptimizationRequest request,
        CancellationToken ct = default)
    {
        var result = await aiService.OptimizeScheduleAsync(request, ct);
        return Ok(result);
    }

    [HttpPost("appointment-suggest")]
    public async Task<ActionResult<ApiResult<AppointmentAutoFillDto>>> SuggestAppointment(
        [FromBody] AppointmentSuggestRequest request,
        CancellationToken ct = default)
    {
        var result = await aiService.SuggestAppointmentAsync(request, ct);
        if (result.Status == "error")
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("patient/{patientId:guid}/summarize-doc")]
    public async Task<ActionResult<ApiResult<LabSummaryResultDto>>> SummarizeDocument(
        Guid patientId,
        [FromBody] SummarizeDocumentRequest request,
        CancellationToken ct = default)
    {
        var result = await documentService.SummarizeDocumentAsync(patientId, request.DocumentId, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost("patient/{patientId:guid}/draft-care-plan")]
    public async Task<ActionResult<ApiResult<CarePlanDraftResultDto>>> DraftCarePlan(Guid patientId, CancellationToken ct)
    {
        var result = await documentService.DraftCarePlanAsync(patientId, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }
}
