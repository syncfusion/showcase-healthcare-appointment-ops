using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using HealthcareAppointmentOps.Domain.Entities;
using System.Text.Json;

namespace HealthcareAppointmentOps.Application.Services;

public class PatientService : IPatientService
{
    private readonly IPatientRepository _patientRepo;
    private readonly IAppointmentRepository _appointmentRepo;
    private readonly ILocationRepository _locationRepo;
    private readonly IAuditLogRepository _auditRepo;
    private readonly IUnitOfWork _unitOfWork;

    public PatientService(
        IPatientRepository patientRepo,
        IAppointmentRepository appointmentRepo,
        ILocationRepository locationRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork unitOfWork)
    {
        _patientRepo = patientRepo;
        _appointmentRepo = appointmentRepo;
        _locationRepo = locationRepo;
        _auditRepo = auditRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResult<PagedResult<PatientSummaryDto>>> ListAsync(string? query, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _patientRepo.ListAsync(query, offset, limit, ct);

        // Project the next upcoming (future, non-terminal) appointment for each
        // patient in the current page. Fetching by patient batch avoids N+1 round-trips.
        var patientIds = items.Select(p => p.PatientId).ToList();
        var now = DateTime.UtcNow;
        var terminalStatuses = new[] { "Cancelled", "NoShow", "Completed" };

        var upcomingAppointments = patientIds.Count == 0
            ? new Dictionary<Guid, Appointment>()
            : (await _appointmentRepo.GetByPatientIdsAsync(patientIds, ct))
                .Where(a => a.ScheduledDateTime > now && !terminalStatuses.Contains(a.Status))
                .GroupBy(a => a.PatientId)
                .ToDictionary(g => g.Key, g => g.OrderBy(a => a.ScheduledDateTime).First());

        var dtos = items.Select(p =>
        {
            var dto = MapSummary(p);
            if (upcomingAppointments.TryGetValue(p.PatientId, out var appt))
            {
                dto.NextAppointmentDateTime = appt.ScheduledDateTime;
                dto.NextAppointmentType = appt.AppointmentType;
                dto.NextAppointmentStatus = appt.Status;
            }
            return dto;
        }).ToList();

        return ApiResult<PagedResult<PatientSummaryDto>>.Success(new PagedResult<PatientSummaryDto>
        {
            Items = dtos,
            Paging = new PagingInfo { Total = total, Limit = limit, Offset = offset }
        });
    }

    public async Task<ApiResult<PatientDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var patient = await _patientRepo.GetByIdAsync(id, ct);
        if (patient == null)
            return ApiResult<PatientDetailDto>.Failure("Patient not found", $"No patient found for ID {id}", "NotFound");
        return ApiResult<PatientDetailDto>.Success(MapDetail(patient));
    }

    public async Task<ApiResult<List<AppointmentSummaryDto>>> GetAppointmentsAsync(Guid patientId, CancellationToken ct = default)
    {
        var appointments = await _appointmentRepo.GetByPatientIdAsync(patientId, ct);
        var dtos = appointments.Select(MapAppointmentSummary).ToList();
        return ApiResult<List<AppointmentSummaryDto>>.Success(dtos);
    }

    private static PatientSummaryDto MapSummary(Patient p) => new()
    {
        PatientId = p.PatientId,
        MedicalRecordNumber = p.MedicalRecordNumber,
        FirstName = p.FirstName,
        LastName = p.LastName,
        DateOfBirth = p.DateOfBirth,
        Gender = p.Gender,
        PhoneNumber = p.PhoneNumber,
        PrimaryCareProviderName = p.PrimaryCareProvider != null ? $"{p.PrimaryCareProvider.FirstName} {p.PrimaryCareProvider.LastName}" : string.Empty,
        IsActive = p.IsActive
    };

    private static PatientDetailDto MapDetail(Patient p)
    {
        var comm = JsonSerializer.Deserialize<CommunicationPreferencesDto>(p.CommunicationPreferences) ?? new CommunicationPreferencesDto();
        return new PatientDetailDto
        {
            PatientId = p.PatientId,
            MedicalRecordNumber = p.MedicalRecordNumber,
            FirstName = p.FirstName,
            LastName = p.LastName,
            DateOfBirth = p.DateOfBirth,
            Gender = p.Gender,
            Email = p.Email,
            PhoneNumber = p.PhoneNumber,
            AddressLine = p.AddressLine,
            City = p.City,
            State = p.State,
            PostalCode = p.PostalCode,
            PreferredLanguage = p.PreferredLanguage,
            PrimaryCareProviderId = p.PrimaryCareProviderId,
            PrimaryCareProviderName = p.PrimaryCareProvider != null ? $"{p.PrimaryCareProvider.FirstName} {p.PrimaryCareProvider.LastName}" : string.Empty,
            InsuranceType = p.InsuranceType,
            RegistrationDate = p.RegistrationDate,
            IsActive = p.IsActive,
            CommunicationPreferences = comm,
            HasProxyAccess = p.HasProxyAccess
        };
    }

    private static AppointmentSummaryDto MapAppointmentSummary(Appointment a) => new()
    {
        AppointmentId = a.AppointmentId,
        PatientName = $"{a.Patient.FirstName} {a.Patient.LastName}",
        PatientMrn = a.Patient.MedicalRecordNumber,
        ProviderName = $"{a.Provider.FirstName} {a.Provider.LastName}",
        ProviderSpecialty = a.Provider.Specialty,
        DepartmentName = a.Department.DepartmentName,
        LocationName = a.Location.LocationName,
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
