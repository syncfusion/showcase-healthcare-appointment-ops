using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using HealthcareAppointmentOps.Domain.Entities;

namespace HealthcareAppointmentOps.Application.Services;

public class ProviderService : IProviderService
{
    private readonly IProviderRepository _providerRepo;
    private readonly IScheduleTemplateRepository _templateRepo;
    private readonly IAppointmentRepository _appointmentRepo;
    private readonly IUnitOfWork _unitOfWork;

    public ProviderService(
        IProviderRepository providerRepo,
        IScheduleTemplateRepository templateRepo,
        IAppointmentRepository appointmentRepo,
        IUnitOfWork unitOfWork)
    {
        _providerRepo = providerRepo;
        _templateRepo = templateRepo;
        _appointmentRepo = appointmentRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResult<PagedResult<ProviderSummaryDto>>> ListAsync(Guid? departmentId, string? specialty, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _providerRepo.ListAsync(departmentId, specialty, offset, limit, ct);
        var dtos = items.Select(MapSummary).ToList();
        return ApiResult<PagedResult<ProviderSummaryDto>>.Success(new PagedResult<ProviderSummaryDto>
        {
            Items = dtos,
            Paging = new PagingInfo { Total = total, Limit = limit, Offset = offset }
        });
    }

    public async Task<ApiResult<ProviderDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var provider = await _providerRepo.GetByIdAsync(id, ct);
        if (provider == null)
            return ApiResult<ProviderDetailDto>.Failure("Provider not found", $"No provider found for ID {id}", "NotFound");
        var dto = MapDetail(provider);
        return ApiResult<ProviderDetailDto>.Success(dto);
    }

    public async Task<ApiResult<List<SlotDto>>> GetAvailabilityAsync(Guid providerId, DateOnly date, CancellationToken ct = default)
    {
        var provider = await _providerRepo.GetByIdAsync(providerId, ct);
        if (provider == null)
            return ApiResult<List<SlotDto>>.Failure("Provider not found", $"No provider found for ID {providerId}", "NotFound");

        var dayOfWeek = (int)date.DayOfWeek;
        var templates = await _templateRepo.GetByProviderIdAsync(providerId, ct);
        var dayTemplate = templates.FirstOrDefault(t => t.DayOfWeek == dayOfWeek && t.IsActive
            && date >= t.EffectiveFrom && (t.EffectiveTo == null || date <= t.EffectiveTo));

        if (dayTemplate == null)
            return ApiResult<List<SlotDto>>.Success([]);

        var from = new DateTime(date.Year, date.Month, date.Day, dayTemplate.StartTime.Hour, dayTemplate.StartTime.Minute, 0, DateTimeKind.Utc);
        var to = new DateTime(date.Year, date.Month, date.Day, dayTemplate.EndTime.Hour, dayTemplate.EndTime.Minute, 0, DateTimeKind.Utc);

        var appointments = await _appointmentRepo.GetByProviderIdAsync(providerId, from, to.AddDays(1), ct);
        var slots = new List<SlotDto>();
        var providerName = $"{provider.FirstName} {provider.LastName}";

        for (var current = from; current < to; current = current.AddMinutes(dayTemplate.SlotDuration))
        {
            var slotEnd = current.AddMinutes(dayTemplate.SlotDuration);
            var isAvailable = !appointments.Any(a =>
                a.Status != "Cancelled" && a.Status != "NoShow" &&
                a.ScheduledDateTime < slotEnd && a.ScheduledDateTime.AddMinutes(a.DurationMinutes) > current);
            slots.Add(new SlotDto
            {
                SlotStart = current,
                SlotEnd = slotEnd,
                ProviderId = providerId,
                ProviderName = providerName,
                IsAvailable = isAvailable,
                LocationId = provider.LocationId
            });
        }

        return ApiResult<List<SlotDto>>.Success(slots);
    }

    public async Task<ApiResult<List<ScheduleTemplateDto>>> GetTemplatesAsync(Guid providerId, CancellationToken ct = default)
    {
        var templates = await _templateRepo.GetByProviderIdAsync(providerId, ct);
        var dtos = templates.Select(MapTemplate).ToList();
        return ApiResult<List<ScheduleTemplateDto>>.Success(dtos);
    }

    private static ProviderSummaryDto MapSummary(Provider p) => new()
    {
        ProviderId = p.ProviderId,
        NpiNumber = p.NpiNumber,
        FirstName = p.FirstName,
        LastName = p.LastName,
        Specialty = p.Specialty,
        Title = p.Title,
        Email = p.Email,
        PhoneNumber = p.PhoneNumber,
        DepartmentId = p.DepartmentId,
        DepartmentName = p.Department?.DepartmentName ?? string.Empty,
        LocationId = p.LocationId,
        LocationName = p.Location?.LocationName ?? string.Empty,
        IsActive = p.IsActive,
        AverageAppointmentDuration = p.AverageAppointmentDuration
    };

    private static ProviderDetailDto MapDetail(Provider p)
    {
        var summary = MapSummary(p);
        return new ProviderDetailDto
        {
            ProviderId = summary.ProviderId,
            NpiNumber = summary.NpiNumber,
            FirstName = summary.FirstName,
            LastName = summary.LastName,
            Specialty = summary.Specialty,
            Title = summary.Title,
            Email = summary.Email,
            PhoneNumber = summary.PhoneNumber,
            DepartmentId = summary.DepartmentId,
            DepartmentName = summary.DepartmentName,
            LocationId = summary.LocationId,
            LocationName = summary.LocationName,
            IsActive = summary.IsActive,
            AverageAppointmentDuration = summary.AverageAppointmentDuration,
            Templates = p.ScheduleTemplates.Select(MapTemplate).ToList()
        };
    }

    private static ScheduleTemplateDto MapTemplate(ScheduleTemplate t) => new()
    {
        TemplateId = t.TemplateId,
        ProviderId = t.ProviderId,
        DepartmentId = t.DepartmentId,
        LocationId = t.LocationId,
        DayOfWeek = t.DayOfWeek,
        StartTime = t.StartTime,
        EndTime = t.EndTime,
        SlotDuration = t.SlotDuration,
        IsActive = t.IsActive,
        EffectiveFrom = t.EffectiveFrom,
        EffectiveTo = t.EffectiveTo
    };
}
