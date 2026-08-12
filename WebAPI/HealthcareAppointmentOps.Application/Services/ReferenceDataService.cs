using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using HealthcareAppointmentOps.Domain.Entities;

namespace HealthcareAppointmentOps.Application.Services;

public class ReferenceDataService : IReferenceDataService
{
    private readonly IDepartmentRepository _departmentRepo;
    private readonly ILocationRepository _locationRepo;

    public ReferenceDataService(IDepartmentRepository departmentRepo, ILocationRepository locationRepo)
    {
        _departmentRepo = departmentRepo;
        _locationRepo = locationRepo;
    }

    public async Task<ApiResult<List<DepartmentDto>>> GetDepartmentsAsync(CancellationToken ct = default)
    {
        var departments = await _departmentRepo.GetAllAsync(ct);
        var dtos = departments.Select(d => new DepartmentDto
        {
            DepartmentId = d.DepartmentId,
            DepartmentName = d.DepartmentName,
            DepartmentCode = d.DepartmentCode,
            LocationId = d.LocationId,
            LocationName = d.Location?.LocationName ?? string.Empty,
            IsActive = d.IsActive
        }).ToList();
        return ApiResult<List<DepartmentDto>>.Success(dtos);
    }

    public async Task<ApiResult<List<LocationDto>>> GetLocationsAsync(CancellationToken ct = default)
    {
        var locations = await _locationRepo.GetAllAsync(ct);
        var dtos = locations.Select(l => new LocationDto
        {
            LocationId = l.LocationId,
            LocationName = l.LocationName,
            AddressLine = l.AddressLine,
            City = l.City,
            State = l.State,
            PostalCode = l.PostalCode,
            PhoneNumber = l.PhoneNumber,
            TimeZone = l.TimeZone,
            IsActive = l.IsActive
        }).ToList();
        return ApiResult<List<LocationDto>>.Success(dtos);
    }
}

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _auditRepo;

    public AuditLogService(IAuditLogRepository auditRepo)
    {
        _auditRepo = auditRepo;
    }

    public async Task<ApiResult<PagedResult<AuditLogEntryDto>>> ListAsync(string? entityType, Guid? entityId, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _auditRepo.ListAsync(entityType, entityId, offset, limit, ct);
        var dtos = items.Select(a => new AuditLogEntryDto
        {
            AuditId = a.AuditId,
            EntityType = a.EntityType,
            EntityId = a.EntityId,
            Action = a.Action,
            PerformedBy = a.PerformedBy,
            PerformedAt = a.PerformedAt,
            IpAddress = a.IpAddress,
            Details = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(a.Details) ?? []
        }).ToList();
        return ApiResult<PagedResult<AuditLogEntryDto>>.Success(new PagedResult<AuditLogEntryDto>
        {
            Items = dtos,
            Paging = new PagingInfo { Total = total, Limit = limit, Offset = offset }
        });
    }
}
