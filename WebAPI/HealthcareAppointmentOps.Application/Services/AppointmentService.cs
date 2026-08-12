using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using HealthcareAppointmentOps.Domain.Entities;

namespace HealthcareAppointmentOps.Application.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _appointmentRepo;
    private readonly IPatientRepository _patientRepo;
    private readonly IProviderRepository _providerRepo;
    private readonly IDepartmentRepository _departmentRepo;
    private readonly ILocationRepository _locationRepo;
    private readonly IAuditLogRepository _auditRepo;
    private readonly IUnitOfWork _unitOfWork;

    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Scheduled", "Confirmed", "CheckedIn", "InProgress", "Completed", "Cancelled", "NoShow"
    };

    private static readonly Dictionary<string, HashSet<string>> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Scheduled"] = new(StringComparer.OrdinalIgnoreCase) { "Confirmed", "Cancelled", "NoShow" },
        ["Confirmed"] = new(StringComparer.OrdinalIgnoreCase) { "CheckedIn", "Cancelled", "NoShow" },
        ["CheckedIn"] = new(StringComparer.OrdinalIgnoreCase) { "InProgress", "Cancelled", "NoShow" },
        ["InProgress"] = new(StringComparer.OrdinalIgnoreCase) { "Completed" },
        ["Completed"] = new(StringComparer.OrdinalIgnoreCase),
        ["Cancelled"] = new(StringComparer.OrdinalIgnoreCase),
        ["NoShow"] = new(StringComparer.OrdinalIgnoreCase)
    };

    public AppointmentService(
        IAppointmentRepository appointmentRepo,
        IPatientRepository patientRepo,
        IProviderRepository providerRepo,
        IDepartmentRepository departmentRepo,
        ILocationRepository locationRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork unitOfWork)
    {
        _appointmentRepo = appointmentRepo;
        _patientRepo = patientRepo;
        _providerRepo = providerRepo;
        _departmentRepo = departmentRepo;
        _locationRepo = locationRepo;
        _auditRepo = auditRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResult<PagedResult<AppointmentSummaryDto>>> ListAsync(Dictionary<string, string>? filters, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _appointmentRepo.ListAsync(filters, offset, limit, ct);
        var dtos = items.Select(MapSummary).ToList();
        return ApiResult<PagedResult<AppointmentSummaryDto>>.Success(new PagedResult<AppointmentSummaryDto>
        {
            Items = dtos,
            Paging = new PagingInfo { Total = total, Limit = limit, Offset = offset }
        });
    }

    public async Task<ApiResult<AppointmentDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var appointment = await _appointmentRepo.GetByIdAsync(id, ct);
        if (appointment == null)
            return ApiResult<AppointmentDetailDto>.Failure("Appointment not found", $"No appointment found for ID {id}", "NotFound");
        return ApiResult<AppointmentDetailDto>.Success(MapDetail(appointment));
    }

    public async Task<ApiResult<AppointmentDetailDto>> CreateAsync(CreateAppointmentRequest request, CancellationToken ct = default)
    {
        if (request.ScheduledDateTime <= DateTime.UtcNow)
            return ApiResult<AppointmentDetailDto>.Failure("Invalid schedule time", "Scheduled date/time must be in the future.", "ValidationError");
        if (request.DurationMinutes <= 0)
            return ApiResult<AppointmentDetailDto>.Failure("Invalid duration", "Duration must be greater than 0.", "ValidationError");

        // Validate referenced entities up front. Inserting an appointment with an
        // unknown FK otherwise fails deep in SaveChanges and surfaces as an opaque
        // 500 ("An error occurred while saving the entity changes" / a raw
        // NullReferenceException when the row is later re-read for mapping). A clean
        // ValidationError tells the caller exactly which reference was wrong.
        if (await _patientRepo.GetByIdAsync(request.PatientId, ct) == null)
            return ApiResult<AppointmentDetailDto>.Failure("Invalid patient", "The selected patient does not exist.", "ValidationError");
        if (await _providerRepo.GetByIdAsync(request.ProviderId, ct) == null)
            return ApiResult<AppointmentDetailDto>.Failure("Invalid provider", "The selected provider does not exist.", "ValidationError");
        if (await _departmentRepo.GetByIdAsync(request.DepartmentId, ct) == null)
            return ApiResult<AppointmentDetailDto>.Failure("Invalid department", "The selected department does not exist.", "ValidationError");
        if (await _locationRepo.GetByIdAsync(request.LocationId, ct) == null)
            return ApiResult<AppointmentDetailDto>.Failure("Invalid location", "The selected location does not exist.", "ValidationError");

        var conflicts = await _appointmentRepo.GetConflictsAsync(request.ProviderId, request.ScheduledDateTime, request.ScheduledDateTime.AddMinutes(request.DurationMinutes), null, ct);
        if (conflicts.Count > 0)
            return ApiResult<AppointmentDetailDto>.Failure("Scheduling conflict", "The requested time slot overlaps with an existing appointment.", "Conflict");

        var appointment = new Appointment
        {
            AppointmentId = Guid.NewGuid(),
            PatientId = request.PatientId,
            ProviderId = request.ProviderId,
            DepartmentId = request.DepartmentId,
            LocationId = request.LocationId,
            AppointmentType = request.AppointmentType,
            Status = "Scheduled",
            ScheduledDateTime = request.ScheduledDateTime,
            DurationMinutes = request.DurationMinutes,
            ReasonForVisit = request.ReasonForVisit,
            Notes = request.Notes ?? string.Empty,
            PatientInstructions = request.PatientInstructions ?? string.Empty,
            CreatedDateTime = DateTime.UtcNow
        };

        try
        {
            await _appointmentRepo.AddAsync(appointment, ct);
            await _auditRepo.AddAsync(CreateAudit("Appointment", appointment.AppointmentId, "Create", $"Created appointment {appointment.AppointmentId}"), ct);
            await _unitOfWork.SaveChangesAsync(ct);

            var full = await _appointmentRepo.GetByIdAsync(appointment.AppointmentId, ct);
            if (full == null)
                return ApiResult<AppointmentDetailDto>.Failure("Appointment not found", "The appointment was created but could not be reloaded.", "NotFound");

            if (full.Patient == null || full.Provider == null || full.Department == null || full.Location == null)
                return ApiResult<AppointmentDetailDto>.Failure("Data integrity", "Related entity missing after save.", "NotFound");

            return ApiResult<AppointmentDetailDto>.Success(MapDetail(full));
        }
        catch (Exception ex)
        {
            return ApiResult<AppointmentDetailDto>.Failure("Unexpected error", ex.Message);
        }
    }

    public async Task<ApiResult<AppointmentDetailDto>> UpdateAsync(Guid id, UpdateAppointmentRequest request, CancellationToken ct = default)
    {
        var appointment = await _appointmentRepo.GetByIdAsync(id, ct);
        if (appointment == null)
            return ApiResult<AppointmentDetailDto>.Failure("Appointment not found", $"No appointment found for ID {id}", "NotFound");

        var conflicts = await _appointmentRepo.GetConflictsAsync(request.ProviderId, request.ScheduledDateTime, request.ScheduledDateTime.AddMinutes(request.DurationMinutes), id, ct);
        if (conflicts.Count > 0)
            return ApiResult<AppointmentDetailDto>.Failure("Scheduling conflict", "The requested time slot overlaps with an existing appointment.", "Conflict");

        appointment.ProviderId = request.ProviderId;
        appointment.DepartmentId = request.DepartmentId;
        appointment.LocationId = request.LocationId;
        appointment.AppointmentType = request.AppointmentType;
        appointment.ScheduledDateTime = request.ScheduledDateTime;
        appointment.DurationMinutes = request.DurationMinutes;
        appointment.ReasonForVisit = request.ReasonForVisit;
        appointment.Notes = request.Notes ?? string.Empty;
        appointment.PatientInstructions = request.PatientInstructions ?? string.Empty;

        _appointmentRepo.Update(appointment);
        await _auditRepo.AddAsync(CreateAudit("Appointment", id, "Update", $"Updated appointment {id}"), ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResult<AppointmentDetailDto>.Success(MapDetail(appointment));
    }

    public async Task<ApiResult<AppointmentDetailDto>> TransitionStatusAsync(Guid id, string status, CancellationToken ct = default)
    {
        if (!ValidStatuses.Contains(status))
            return ApiResult<AppointmentDetailDto>.Failure("Invalid status", $"Status '{status}' is not valid.", "ValidationError");

        var appointment = await _appointmentRepo.GetByIdAsync(id, ct);
        if (appointment == null)
            return ApiResult<AppointmentDetailDto>.Failure("Appointment not found", $"No appointment found for ID {id}", "NotFound");

        if (!AllowedTransitions.TryGetValue(appointment.Status, out var allowed) || !allowed.Contains(status))
            return ApiResult<AppointmentDetailDto>.Failure("Invalid transition", $"Cannot transition from {appointment.Status} to {status}.", "ValidationError");

        appointment.Status = status;
        if (status == "CheckedIn")
            appointment.CheckedInDateTime = DateTime.UtcNow;
        if (status == "Completed")
            appointment.CompletedDateTime = DateTime.UtcNow;

        _appointmentRepo.Update(appointment);
        await _auditRepo.AddAsync(CreateAudit("Appointment", id, "Update", $"Status transitioned to {status}"), ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResult<AppointmentDetailDto>.Success(MapDetail(appointment));
    }

    public async Task<ApiResult<AppointmentDetailDto>> CancelAsync(Guid id, string? reason, CancellationToken ct = default)
    {
        var appointment = await _appointmentRepo.GetByIdAsync(id, ct);
        if (appointment == null)
            return ApiResult<AppointmentDetailDto>.Failure("Appointment not found", $"No appointment found for ID {id}", "NotFound");

        appointment.Status = "Cancelled";
        appointment.CancellationReason = reason;
        _appointmentRepo.Update(appointment);
        await _auditRepo.AddAsync(CreateAudit("Appointment", id, "Update", $"Cancelled appointment {id}"), ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResult<AppointmentDetailDto>.Success(MapDetail(appointment));
    }

    public async Task<ApiResult<AppointmentDetailDto>> CheckInAsync(Guid id, string? source, CancellationToken ct = default)
    {
        var appointment = await _appointmentRepo.GetByIdAsync(id, ct);
        if (appointment == null)
            return ApiResult<AppointmentDetailDto>.Failure("Appointment not found", $"No appointment found for ID {id}", "NotFound");

        appointment.Status = "CheckedIn";
        appointment.CheckedInDateTime = DateTime.UtcNow;
        appointment.CheckInSource = source;
        _appointmentRepo.Update(appointment);
        await _auditRepo.AddAsync(CreateAudit("Appointment", id, "Update", "Patient checked in"), ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResult<AppointmentDetailDto>.Success(MapDetail(appointment));
    }

    public async Task<ApiResult<AppointmentDetailDto>> MarkNoShowAsync(Guid id, CancellationToken ct = default)
    {
        var appointment = await _appointmentRepo.GetByIdAsync(id, ct);
        if (appointment == null)
            return ApiResult<AppointmentDetailDto>.Failure("Appointment not found", $"No appointment found for ID {id}", "NotFound");

        appointment.Status = "NoShow";
        _appointmentRepo.Update(appointment);
        await _auditRepo.AddAsync(CreateAudit("Appointment", id, "Update", "Marked as no-show"), ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResult<AppointmentDetailDto>.Success(MapDetail(appointment));
    }

    public async Task<ApiResult<List<ConflictDto>>> GetConflictsAsync(Guid providerId, DateTime scheduledDateTime, int durationMinutes, Guid? excludeId, CancellationToken ct = default)
    {
        var conflicts = await _appointmentRepo.GetConflictsAsync(providerId, scheduledDateTime, scheduledDateTime.AddMinutes(durationMinutes), excludeId, ct);
        var dtos = conflicts.Select(c => new ConflictDto
        {
            AppointmentId = c.AppointmentId,
            ProviderId = c.ProviderId,
            ScheduledDateTime = c.ScheduledDateTime,
            DurationMinutes = c.DurationMinutes,
            Reason = $"Overlaps with {c.AppointmentType} appointment"
        }).ToList();
        return ApiResult<List<ConflictDto>>.Success(dtos);
    }

    private static AppointmentSummaryDto MapSummary(Appointment a) => new()
    {
        AppointmentId = a.AppointmentId,
        PatientName = $"{a.Patient?.FirstName ?? "Unknown"} {a.Patient?.LastName ?? ""}".Trim(),
        PatientMrn = a.Patient?.MedicalRecordNumber ?? "",
        ProviderName = $"{a.Provider?.FirstName ?? "Unknown"} {a.Provider?.LastName ?? ""}".Trim(),
        ProviderSpecialty = a.Provider?.Specialty ?? "",
        DepartmentName = a.Department?.DepartmentName ?? "",
        LocationName = a.Location?.LocationName ?? "",
        AppointmentType = a.AppointmentType,
        Status = a.Status,
        PatientId = a.PatientId,
        ProviderId = a.ProviderId,
        DepartmentId = a.DepartmentId,
        LocationId = a.LocationId,
        ScheduledDateTime = a.ScheduledDateTime,
        DurationMinutes = a.DurationMinutes,
        RoomNumber = a.RoomNumber,
        CheckInSource = a.CheckInSource
    };

    private static AppointmentDetailDto MapDetail(Appointment a) => new()
    {
        AppointmentId = a.AppointmentId,
        PatientName = $"{a.Patient?.FirstName ?? "Unknown"} {a.Patient?.LastName ?? ""}".Trim(),
        PatientMrn = a.Patient?.MedicalRecordNumber ?? "",
        ProviderName = $"{a.Provider?.FirstName ?? "Unknown"} {a.Provider?.LastName ?? ""}".Trim(),
        ProviderSpecialty = a.Provider?.Specialty ?? "",
        DepartmentName = a.Department?.DepartmentName ?? "",
        LocationName = a.Location?.LocationName ?? "",
        AppointmentType = a.AppointmentType,
        Status = a.Status,
        PatientId = a.PatientId,
        ProviderId = a.ProviderId,
        DepartmentId = a.DepartmentId,
        LocationId = a.LocationId,
        ScheduledDateTime = a.ScheduledDateTime,
        DurationMinutes = a.DurationMinutes,
        RoomNumber = a.RoomNumber,
        CheckInSource = a.CheckInSource,
        ReasonForVisit = a.ReasonForVisit,
        Notes = a.Notes,
        PatientInstructions = a.PatientInstructions,
        CancellationReason = a.CancellationReason,
        CreatedDateTime = a.CreatedDateTime,
        CheckedInDateTime = a.CheckedInDateTime,
        CompletedDateTime = a.CompletedDateTime
    };

    private static AuditLogEntry CreateAudit(string entityType, Guid entityId, string action, string detail) => new()
    {
        AuditId = Guid.NewGuid(),
        EntityType = entityType,
        EntityId = entityId,
        Action = action,
        PerformedBy = "Admin",
        PerformedAt = DateTime.UtcNow,
        IpAddress = "127.0.0.1",
        Details = $"{{\"message\":\"{detail}\"}}"
    };
}
