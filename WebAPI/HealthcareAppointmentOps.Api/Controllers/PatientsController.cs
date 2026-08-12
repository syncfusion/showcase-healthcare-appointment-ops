using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/patients")]
public class PatientsController(
    IPatientService patientService,
    IClinicalHistoryService clinicalHistoryService,
    IMedicationService medicationService,
    IDocumentService documentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<PatientSummaryDto>>>> List(
        [FromQuery] string? q,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var result = await patientService.ListAsync(q, offset, limit, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResult<PatientDetailDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await patientService.GetByIdAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id:guid}/appointments")]
    public async Task<ActionResult<ApiResult<List<AppointmentSummaryDto>>>> GetAppointments(Guid id, CancellationToken ct)
    {
        var result = await patientService.GetAppointmentsAsync(id, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/clinical-history")]
    public async Task<ActionResult<ApiResult<ClinicalHistoryDto>>> GetClinicalHistory(Guid id, CancellationToken ct)
    {
        var result = await clinicalHistoryService.GetForPatientAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id:guid}/medications")]
    public async Task<ActionResult<ApiResult<MedicationHistoryDto>>> GetMedications(Guid id, CancellationToken ct)
    {
        var result = await medicationService.GetForPatientAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id:guid}/documents")]
    public async Task<ActionResult<ApiResult<List<DocumentDto>>>> GetDocuments(Guid id, CancellationToken ct)
    {
        var result = await documentService.GetForPatientAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id:guid}/documents/{documentId:guid}/pdf")]
    public async Task<IActionResult> GetDocumentPdf(Guid id, Guid documentId, CancellationToken ct)
    {
        var result = await documentService.GetDocumentContentAsync(id, documentId, ct);
        if (result.Status == "error")
        {
            if (result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                return NotFound(result);
            return BadRequest(result);
        }

        var content = result.Data!;
        return File(content.Content, content.ContentType, content.FileName);
    }

    [HttpGet("{id:guid}/care-plan")]
    public async Task<ActionResult<ApiResult<CarePlanDto>>> GetCarePlan(Guid id, CancellationToken ct)
    {
        var result = await documentService.GetCarePlanAsync(id, ct);
        if (result.Status == "error" && result.Error?.Title.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
            return NotFound(result);
        return Ok(result);
    }
}
