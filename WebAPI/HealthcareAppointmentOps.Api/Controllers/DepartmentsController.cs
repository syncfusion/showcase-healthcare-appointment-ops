using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/departments")]
public class DepartmentsController(IReferenceDataService referenceDataService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResult<List<DepartmentDto>>>> List(CancellationToken ct = default)
    {
        var result = await referenceDataService.GetDepartmentsAsync(ct);
        return Ok(result);
    }
}
