using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Domain.Entities;

namespace HealthcareAppointmentOps.Application.Abstractions;

public interface IPatientRepository
{
    Task<Patient?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Patient?> GetByMrnAsync(string mrn, CancellationToken ct = default);
    Task<(List<Patient> Items, int Total)> ListAsync(string? query, int offset, int limit, CancellationToken ct = default);
    Task AddAsync(Patient patient, CancellationToken ct = default);
    void Update(Patient patient);
    Task<List<Patient>> GetByProviderIdAsync(Guid providerId, CancellationToken ct = default);
}

public interface IProviderRepository
{
    Task<Provider?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<(List<Provider> Items, int Total)> ListAsync(Guid? departmentId, string? specialty, int offset, int limit, CancellationToken ct = default);
    Task<List<Provider>> GetAllAsync(CancellationToken ct = default);
}

public interface IAppointmentRepository
{
    Task<Appointment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<(List<Appointment> Items, int Total)> ListAsync(Dictionary<string, string>? filters, int offset, int limit, CancellationToken ct = default);
    Task AddAsync(Appointment appointment, CancellationToken ct = default);
    void Update(Appointment appointment);
    Task<List<Appointment>> GetByPatientIdAsync(Guid patientId, CancellationToken ct = default);
    Task<List<Appointment>> GetByPatientIdsAsync(IReadOnlyCollection<Guid> patientIds, CancellationToken ct = default);
    Task<List<Appointment>> GetByProviderIdAsync(Guid providerId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<List<Appointment>> GetConflictsAsync(Guid providerId, DateTime start, DateTime end, Guid? excludeId, CancellationToken ct = default);
    Task<List<Appointment>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken ct = default);
}

public interface IWaitlistRepository
{
    Task<WaitlistEntry?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<(List<WaitlistEntry> Items, int Total)> ListAsync(string? status, Guid? departmentId, int offset, int limit, CancellationToken ct = default);
    Task AddAsync(WaitlistEntry entry, CancellationToken ct = default);
    void Update(WaitlistEntry entry);
    void Remove(WaitlistEntry entry);
    Task<WaitlistMetricsDto> GetMetricsAsync(CancellationToken ct = default);
}

public interface ILocationRepository
{
    Task<List<Location>> GetAllAsync(CancellationToken ct = default);
    Task<Location?> GetByIdAsync(Guid id, CancellationToken ct = default);
}

public interface IDepartmentRepository
{
    Task<List<Department>> GetAllAsync(CancellationToken ct = default);
    Task<Department?> GetByIdAsync(Guid id, CancellationToken ct = default);
}

public interface IScheduleTemplateRepository
{
    Task<List<ScheduleTemplate>> GetByProviderIdAsync(Guid providerId, CancellationToken ct = default);
    Task<ScheduleTemplate?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ScheduleTemplate template, CancellationToken ct = default);
    void Update(ScheduleTemplate template);
}

public interface IAuditLogRepository
{
    Task AddAsync(AuditLogEntry entry, CancellationToken ct = default);
    Task<(List<AuditLogEntry> Items, int Total)> ListAsync(string? entityType, Guid? entityId, int offset, int limit, CancellationToken ct = default);
}

public interface IClinicalHistoryRepository
{
    Task<List<Encounter>> GetEncountersAsync(Guid patientId, CancellationToken ct = default);
    Task<List<VitalReading>> GetVitalsAsync(Guid patientId, CancellationToken ct = default);
    Task<List<LabResult>> GetLabsAsync(Guid patientId, CancellationToken ct = default);
    Task<List<Referral>> GetReferralsAsync(Guid patientId, CancellationToken ct = default);
}

public interface IMedicationRepository
{
    Task<List<Medication>> GetByPatientIdAsync(Guid patientId, CancellationToken ct = default);
    Task<List<MedicationRefill>> GetRefillsByPatientIdAsync(Guid patientId, CancellationToken ct = default);
}

public interface IDocumentRepository
{
    Task<List<Document>> GetByPatientIdAsync(Guid patientId, CancellationToken ct = default);
    Task<CarePlan?> GetCarePlanAsync(Guid patientId, CancellationToken ct = default);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
