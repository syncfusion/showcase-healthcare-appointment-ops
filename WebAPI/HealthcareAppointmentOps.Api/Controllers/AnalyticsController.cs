using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareAppointmentOps.Api.Controllers;

[ApiController]
[Route("api/v1/analytics")]
public class AnalyticsController(IAnalyticsService analyticsService) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResult<DashboardKpiDto>>> GetDashboardKpis(
        [FromQuery] DateOnly? period,
        CancellationToken ct = default)
    {
        var result = await analyticsService.GetDashboardKpisAsync(period, period, ct);
        return Ok(result);
    }

    [HttpGet("provider-utilization")]
    public async Task<ActionResult<ApiResult<List<UtilizationDataPointDto>>>> GetProviderUtilization(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate,
        [FromQuery] Guid? providerId,
        [FromQuery] Guid? departmentId,
        CancellationToken ct)
    {
        var result = await analyticsService.GetProviderUtilizationAsync(startDate, endDate, providerId, departmentId, ct);
        return Ok(result);
    }

    [HttpGet("no-show-trends")]
    public async Task<ActionResult<ApiResult<List<NoShowTrendDto>>>> GetNoShowTrends(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate,
        [FromQuery] Guid? departmentId,
        CancellationToken ct)
    {
        var result = await analyticsService.GetNoShowTrendsAsync(startDate, endDate, departmentId, ct);
        return Ok(result);
    }

    [HttpGet("appointment-volume")]
    public async Task<ActionResult<ApiResult<List<VolumeDataPointDto>>>> GetAppointmentVolume(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate,
        CancellationToken ct)
    {
        var result = await analyticsService.GetAppointmentVolumeAsync(startDate, endDate, ct);
        return Ok(result);
    }

    [HttpGet("cancellation-reasons")]
    public async Task<ActionResult<ApiResult<List<CancellationReasonDto>>>> GetCancellationReasons(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate,
        [FromQuery] Guid? departmentId,
        CancellationToken ct)
    {
        var result = await analyticsService.GetCancellationReasonsAsync(startDate, endDate, departmentId, ct);
        return Ok(result);
    }
}
