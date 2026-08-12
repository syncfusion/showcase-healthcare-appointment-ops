using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using HealthcareAppointmentOps.Domain.Entities;

namespace HealthcareAppointmentOps.Application.Services;

public class WaitlistService : IWaitlistService
{
    private readonly IWaitlistRepository _waitlistRepo;
    private readonly IAppointmentRepository _appointmentRepo;
    private readonly IAuditLogRepository _auditRepo;
    private readonly IUnitOfWork _unitOfWork;

    public WaitlistService(
        IWaitlistRepository waitlistRepo,
        IAppointmentRepository appointmentRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork unitOfWork)
    {
        _waitlistRepo = waitlistRepo;
        _appointmentRepo = appointmentRepo;
        _auditRepo = auditRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResult<PagedResult<WaitlistEntryDto>>> ListAsync(string? status, Guid? departmentId, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _waitlistRepo.ListAsync(status, departmentId, offset, limit, ct);
        var dtos = items.Select(MapDto).ToList();
        return ApiResult<PagedResult<WaitlistEntryDto>>.Success(new PagedResult<WaitlistEntryDto>
        {
            Items = dtos,
            Paging = new PagingInfo { Total = total, Limit = limit, Offset = offset }
        });
    }

    public async Task<ApiResult<WaitlistEntryDto>> MatchAsync(Guid id, Guid appointmentId, CancellationToken ct = default)
    {
        var entry = await _waitlistRepo.GetByIdAsync(id, ct);
        if (entry == null)
            return ApiResult<WaitlistEntryDto>.Failure("Waitlist entry not found", $"No entry found for ID {id}", "NotFound");

        var appointment = await _appointmentRepo.GetByIdAsync(appointmentId, ct);
        if (appointment == null)
            return ApiResult<WaitlistEntryDto>.Failure("Appointment not found", $"No appointment found for ID {appointmentId}", "NotFound");

        entry.Status = "Matched";
        entry.MatchedAppointmentId = appointmentId;
        _waitlistRepo.Update(entry);
        await _auditRepo.AddAsync(CreateAudit("WaitlistEntry", id, "Update", $"Matched to appointment {appointmentId}"), ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResult<WaitlistEntryDto>.Success(MapDto(entry));
    }

    public async Task<ApiResult<bool>> RemoveAsync(Guid id, CancellationToken ct = default)
    {
        var entry = await _waitlistRepo.GetByIdAsync(id, ct);
        if (entry == null)
            return ApiResult<bool>.Failure("Waitlist entry not found", $"No entry found for ID {id}", "NotFound");

        _waitlistRepo.Remove(entry);
        await _auditRepo.AddAsync(CreateAudit("WaitlistEntry", id, "Delete", "Removed from waitlist"), ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResult<bool>.Success(true);
    }

    private static WaitlistEntryDto MapDto(WaitlistEntry w) => new()
    {
        WaitlistId = w.WaitlistId,
        PatientId = w.PatientId,
        PatientName = w.Patient != null ? $"{w.Patient.FirstName} {w.Patient.LastName}" : string.Empty,
        PreferredProviderId = w.PreferredProviderId,
        PreferredProviderName = w.PreferredProvider != null ? $"{w.PreferredProvider.FirstName} {w.PreferredProvider.LastName}" : null,
        PreferredDepartmentId = w.PreferredDepartmentId,
        PreferredDepartmentName = w.PreferredDepartment?.DepartmentName ?? string.Empty,
        PreferredLocationName = w.PreferredDepartment?.Location?.LocationName ?? string.Empty,
        PreferredDateRangeStart = w.PreferredDateRangeStart,
        PreferredDateRangeEnd = w.PreferredDateRangeEnd,
        PriorityScore = w.PriorityScore,
        UrgencyLevel = w.UrgencyLevel,
        RequestedAppointmentType = w.RequestedAppointmentType,
        RequestDateTime = w.RequestDateTime,
        Status = w.Status,
        MatchedAppointmentId = w.MatchedAppointmentId
    };

    private static AuditLogEntry CreateAudit(string entityType, Guid entityId, string action, string detail) => new()
    {
        AuditId = Guid.NewGuid(),
        EntityType = entityType,
        EntityId = entityId,
        Action = action,
        PerformedBy = "system",
        PerformedAt = DateTime.UtcNow,
        IpAddress = "127.0.0.1",
        Details = $"{{\"message\":\"{detail}\"}}"
    };
}
