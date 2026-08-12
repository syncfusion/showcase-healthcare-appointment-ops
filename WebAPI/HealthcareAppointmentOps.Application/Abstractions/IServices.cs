using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;
using HealthcareAppointmentOps.Domain.Entities;

namespace HealthcareAppointmentOps.Application.Abstractions;

public interface IPatientService
{
    Task<ApiResult<PagedResult<PatientSummaryDto>>> ListAsync(string? query, int offset, int limit, CancellationToken ct = default);
    Task<ApiResult<PatientDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResult<List<AppointmentSummaryDto>>> GetAppointmentsAsync(Guid patientId, CancellationToken ct = default);
}

public interface IProviderService
{
    Task<ApiResult<PagedResult<ProviderSummaryDto>>> ListAsync(Guid? departmentId, string? specialty, int offset, int limit, CancellationToken ct = default);
    Task<ApiResult<ProviderDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResult<List<SlotDto>>> GetAvailabilityAsync(Guid providerId, DateOnly date, CancellationToken ct = default);
    Task<ApiResult<List<ScheduleTemplateDto>>> GetTemplatesAsync(Guid providerId, CancellationToken ct = default);
}

public interface IAppointmentService
{
    Task<ApiResult<PagedResult<AppointmentSummaryDto>>> ListAsync(Dictionary<string, string>? filters, int offset, int limit, CancellationToken ct = default);
    Task<ApiResult<AppointmentDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResult<AppointmentDetailDto>> CreateAsync(CreateAppointmentRequest request, CancellationToken ct = default);
    Task<ApiResult<AppointmentDetailDto>> UpdateAsync(Guid id, UpdateAppointmentRequest request, CancellationToken ct = default);
    Task<ApiResult<AppointmentDetailDto>> TransitionStatusAsync(Guid id, string status, CancellationToken ct = default);
    Task<ApiResult<AppointmentDetailDto>> CancelAsync(Guid id, string? reason, CancellationToken ct = default);
    Task<ApiResult<AppointmentDetailDto>> CheckInAsync(Guid id, string? source, CancellationToken ct = default);
    Task<ApiResult<AppointmentDetailDto>> MarkNoShowAsync(Guid id, CancellationToken ct = default);
    Task<ApiResult<List<ConflictDto>>> GetConflictsAsync(Guid providerId, DateTime scheduledDateTime, int durationMinutes, Guid? excludeId, CancellationToken ct = default);
}

public interface IWaitlistService
{
    Task<ApiResult<PagedResult<WaitlistEntryDto>>> ListAsync(string? status, Guid? departmentId, int offset, int limit, CancellationToken ct = default);
    Task<ApiResult<WaitlistEntryDto>> MatchAsync(Guid id, Guid appointmentId, CancellationToken ct = default);
    Task<ApiResult<bool>> RemoveAsync(Guid id, CancellationToken ct = default);
}

public interface IAnalyticsService
{
    Task<ApiResult<DashboardKpiDto>> GetDashboardKpisAsync(DateOnly? periodStart, DateOnly? periodEnd, CancellationToken ct = default);
    Task<ApiResult<List<UtilizationDataPointDto>>> GetProviderUtilizationAsync(DateOnly startDate, DateOnly endDate, Guid? providerId, Guid? departmentId, CancellationToken ct = default);
    Task<ApiResult<List<NoShowTrendDto>>> GetNoShowTrendsAsync(DateOnly startDate, DateOnly endDate, Guid? departmentId, CancellationToken ct = default);
    Task<ApiResult<List<VolumeDataPointDto>>> GetAppointmentVolumeAsync(DateOnly startDate, DateOnly endDate, CancellationToken ct = default);
    Task<ApiResult<List<CancellationReasonDto>>> GetCancellationReasonsAsync(DateOnly startDate, DateOnly endDate, Guid? departmentId, CancellationToken ct = default);
}

public interface IAiService
{
    Task<ApiResult<ScheduleOptimizationDto>> OptimizeScheduleAsync(ScheduleOptimizationRequest request, CancellationToken ct = default);
    Task<ApiResult<AppointmentAutoFillDto>> SuggestAppointmentAsync(AppointmentSuggestRequest request, CancellationToken ct = default);
}

public interface IReferenceDataService
{
    Task<ApiResult<List<DepartmentDto>>> GetDepartmentsAsync(CancellationToken ct = default);
    Task<ApiResult<List<LocationDto>>> GetLocationsAsync(CancellationToken ct = default);
}

public interface IAuditLogService
{
    Task<ApiResult<PagedResult<AuditLogEntryDto>>> ListAsync(string? entityType, Guid? entityId, int offset, int limit, CancellationToken ct = default);
}

public interface IClinicalHistoryService
{
    Task<ApiResult<ClinicalHistoryDto>> GetForPatientAsync(Guid patientId, CancellationToken ct = default);
}

public interface IMedicationService
{
    Task<ApiResult<MedicationHistoryDto>> GetForPatientAsync(Guid patientId, CancellationToken ct = default);
}

public interface IDocumentService
{
    Task<ApiResult<List<DocumentDto>>> GetForPatientAsync(Guid patientId, CancellationToken ct = default);
    Task<ApiResult<DocumentPdfContent>> GetDocumentContentAsync(Guid patientId, Guid documentId, CancellationToken ct = default);
    Task<ApiResult<LabSummaryResultDto>> SummarizeDocumentAsync(Guid patientId, Guid documentId, CancellationToken ct = default);
    Task<ApiResult<CarePlanDto>> GetCarePlanAsync(Guid patientId, CancellationToken ct = default);
    Task<ApiResult<CarePlanDraftResultDto>> DraftCarePlanAsync(Guid patientId, CancellationToken ct = default);
}

public interface IDocumentPdfRenderer
{
    DocumentPdfContent Render(Document document, Patient patient);
}
