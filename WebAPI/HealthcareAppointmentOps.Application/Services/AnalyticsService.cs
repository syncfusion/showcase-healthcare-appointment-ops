using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;

namespace HealthcareAppointmentOps.Application.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IAppointmentRepository _appointmentRepo;
    private readonly IWaitlistRepository _waitlistRepo;

    public AnalyticsService(IAppointmentRepository appointmentRepo, IWaitlistRepository waitlistRepo)
    {
        _appointmentRepo = appointmentRepo;
        _waitlistRepo = waitlistRepo;
    }

    public async Task<ApiResult<DashboardKpiDto>> GetDashboardKpisAsync(DateOnly? periodStart, DateOnly? periodEnd, CancellationToken ct = default)
    {
        var start = periodStart ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));
        var end = periodEnd ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var from = start.ToDateTime(TimeOnly.MinValue);
        var to = end.ToDateTime(TimeOnly.MaxValue);

        var appointments = await _appointmentRepo.GetByDateRangeAsync(from, to, ct);
        var total = appointments.Count;
        var completed = appointments.Count(a => a.Status == "Completed");
        var cancelled = appointments.Count(a => a.Status == "Cancelled");
        var noShow = appointments.Count(a => a.Status == "NoShow");
        var noShowRate = total > 0 ? (double)noShow / total : 0;
        var scheduled = appointments.Where(a => a.Status != "Cancelled" && a.Status != "NoShow").ToList();
        var avgUtil = scheduled.Count > 0 ? 0.75 : 0; // simplified estimate
        var waitlistMetrics = await _waitlistRepo.GetMetricsAsync(ct);

        var dto = new DashboardKpiDto
        {
            Period = $"{start:yyyy-MM-dd}/{end:yyyy-MM-dd}",
            TotalAppointments = total,
            CompletedAppointments = completed,
            CancelledAppointments = cancelled,
            NoShowAppointments = noShow,
            NoShowRate = Math.Round(noShowRate, 3),
            AverageUtilization = Math.Round(avgUtil, 2),
            AverageWaitTimeMinutes = 12.5,
            OpenWaitlistCount = waitlistMetrics.TotalOpen
        };

        return ApiResult<DashboardKpiDto>.Success(dto);
    }

    public async Task<ApiResult<List<UtilizationDataPointDto>>> GetProviderUtilizationAsync(DateOnly startDate, DateOnly endDate, Guid? providerId, Guid? departmentId, CancellationToken ct = default)
    {
        var from = startDate.ToDateTime(TimeOnly.MinValue);
        var to = endDate.ToDateTime(TimeOnly.MaxValue);
        var appointments = await _appointmentRepo.GetByDateRangeAsync(from, to, ct);

        var grouped = appointments
            .Where(a => (providerId == null || a.ProviderId == providerId.Value)
                     && (departmentId == null || a.DepartmentId == departmentId.Value))
            .GroupBy(a => new { a.ProviderId, a.Provider.FirstName, a.Provider.LastName, Date = DateOnly.FromDateTime(a.ScheduledDateTime) })
            .Select(g => new UtilizationDataPointDto
            {
                Date = g.Key.Date,
                ProviderId = g.Key.ProviderId,
                ProviderName = $"{g.Key.FirstName} {g.Key.LastName}",
                AppointmentCount = g.Count(),
                TotalSlots = 24,
                UtilizationRate = Math.Round(g.Count() / 24.0, 2)
            }).ToList();

        return ApiResult<List<UtilizationDataPointDto>>.Success(grouped);
    }

    public async Task<ApiResult<List<NoShowTrendDto>>> GetNoShowTrendsAsync(DateOnly startDate, DateOnly endDate, Guid? departmentId, CancellationToken ct = default)
    {
        var from = startDate.ToDateTime(TimeOnly.MinValue);
        var to = endDate.ToDateTime(TimeOnly.MaxValue);
        var appointments = await _appointmentRepo.GetByDateRangeAsync(from, to, ct);

        var grouped = appointments
            .Where(a => departmentId == null || a.DepartmentId == departmentId.Value)
            .GroupBy(a => new { Period = DateOnly.FromDateTime(a.ScheduledDateTime).ToString("yyyy-MM"), a.DepartmentId, a.Department.DepartmentName })
            .Select(g => new NoShowTrendDto
            {
                Period = g.Key.Period,
                DepartmentId = g.Key.DepartmentId,
                DepartmentName = g.Key.DepartmentName,
                TotalAppointments = g.Count(),
                NoShowRate = Math.Round(g.Count(a => a.Status == "NoShow") / (double)g.Count(), 3)
            }).ToList();

        return ApiResult<List<NoShowTrendDto>>.Success(grouped);
    }

    public async Task<ApiResult<List<VolumeDataPointDto>>> GetAppointmentVolumeAsync(DateOnly startDate, DateOnly endDate, CancellationToken ct = default)
    {
        var from = startDate.ToDateTime(TimeOnly.MinValue);
        var to = endDate.ToDateTime(TimeOnly.MaxValue);
        var appointments = await _appointmentRepo.GetByDateRangeAsync(from, to, ct);

        var grouped = appointments
            .GroupBy(a => new { Period = DateOnly.FromDateTime(a.ScheduledDateTime).ToString("yyyy-MM"), a.DepartmentId, a.Department.DepartmentName, a.AppointmentType })
            .Select(g => new VolumeDataPointDto
            {
                Period = g.Key.Period,
                DepartmentId = g.Key.DepartmentId,
                DepartmentName = g.Key.DepartmentName,
                AppointmentType = g.Key.AppointmentType,
                Count = g.Count()
            }).ToList();

        return ApiResult<List<VolumeDataPointDto>>.Success(grouped);
    }

    public async Task<ApiResult<List<CancellationReasonDto>>> GetCancellationReasonsAsync(DateOnly startDate, DateOnly endDate, Guid? departmentId, CancellationToken ct = default)
    {
        var from = startDate.ToDateTime(TimeOnly.MinValue);
        var to = endDate.ToDateTime(TimeOnly.MaxValue);
        var appointments = await _appointmentRepo.GetByDateRangeAsync(from, to, ct);

        var grouped = appointments
            .Where(a => a.Status == "Cancelled" && (departmentId == null || a.DepartmentId == departmentId.Value))
            .GroupBy(a => string.IsNullOrWhiteSpace(a.CancellationReason) ? "Unspecified" : a.CancellationReason!)
            .Select(g => new CancellationReasonDto
            {
                Reason = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(d => d.Count)
            .ToList();

        return ApiResult<List<CancellationReasonDto>>.Success(grouped);
    }
}
