using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/locations")]
public class LocationsController(IReferenceDataService referenceDataService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResult<List<LocationDto>>>> List(CancellationToken ct = default)
    {
        var result = await referenceDataService.GetLocationsAsync(ct);
        return Ok(result);
    }
}
