using System.Globalization;
using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Infrastructure.Persistence;

namespace HealthcareAppointmentOps.Infrastructure.Repositories.Overlay;

/// <summary>
/// Wraps <see cref="AppointmentRepository"/> so that, in the read-only demo, writes
/// are captured in the per-session <see cref="IInMemoryOverrideStore{TEntity, TKey}"/>
/// and reads merge that overlay on top of the database rows. Nothing is persisted.
/// </summary>
public sealed class OverlayAppointmentRepository : IAppointmentRepository
{
    private readonly AppointmentRepository _inner;
    private readonly IInMemoryOverrideStore<Appointment, Guid> _store;
    private readonly IDemoSessionAccessor _session;
    private readonly IPatientRepository _patients;
    private readonly IProviderRepository _providers;
    private readonly IDepartmentRepository _departments;
    private readonly ILocationRepository _locations;

    public OverlayAppointmentRepository(
        AppointmentRepository inner,
        IInMemoryOverrideStore<Appointment, Guid> store,
        IDemoSessionAccessor session,
        IPatientRepository patients,
        IProviderRepository providers,
        IDepartmentRepository departments,
        ILocationRepository locations)
    {
        _inner = inner;
        _store = store;
        _session = session;
        _patients = patients;
        _providers = providers;
        _departments = departments;
        _locations = locations;
    }

    private string S => _session.SessionKey;

    public async Task<Appointment?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        if (_store.TryGet(S, id, out var overlaid, out var deleted))
            return deleted ? null : overlaid;
        return await _inner.GetByIdAsync(id, ct);
    }

    public async Task<(List<Appointment> Items, int Total)> ListAsync(Dictionary<string, string>? filters, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _inner.ListAsync(filters, offset, limit, ct);
        var merged = _store.Merge(S, items, a => a.AppointmentId, MatchesFilters(filters))
            .OrderByDescending(a => a.ScheduledDateTime)
            .ToList();
        var delta = merged.Count - items.Count;
        return (merged, Math.Max(0, total + delta));
    }

    public async Task AddAsync(Appointment appointment, CancellationToken ct = default)
    {
        appointment.Patient = (await _patients.GetByIdAsync(appointment.PatientId, ct))!;
        appointment.Provider = (await _providers.GetByIdAsync(appointment.ProviderId, ct))!;
        appointment.Department = (await _departments.GetByIdAsync(appointment.DepartmentId, ct))!;
        appointment.Location = (await _locations.GetByIdAsync(appointment.LocationId, ct))!;
        _store.Upsert(S, appointment.AppointmentId, appointment);
    }

    public void Update(Appointment appointment)
        => _store.Upsert(S, appointment.AppointmentId, appointment);

    public async Task<List<Appointment>> GetByPatientIdAsync(Guid patientId, CancellationToken ct = default)
    {
        var items = await _inner.GetByPatientIdAsync(patientId, ct);
        return _store.Merge(S, items, a => a.AppointmentId, a => a.PatientId == patientId)
            .OrderByDescending(a => a.ScheduledDateTime)
            .ToList();
    }

    public async Task<List<Appointment>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken ct = default)
    {
        var items = await _inner.GetByDateRangeAsync(from, to, ct);
        return _store.Merge(S, items, a => a.AppointmentId, a => a.ScheduledDateTime >= from && a.ScheduledDateTime < to);
    }

    public Task<List<Appointment>> GetByPatientIdsAsync(IReadOnlyCollection<Guid> patientIds, CancellationToken ct = default)
        => _inner.GetByPatientIdsAsync(patientIds, ct);

    public Task<List<Appointment>> GetByProviderIdAsync(Guid providerId, DateTime from, DateTime to, CancellationToken ct = default)
        => _inner.GetByProviderIdAsync(providerId, from, to, ct);

    public Task<List<Appointment>> GetConflictsAsync(Guid providerId, DateTime start, DateTime end, Guid? excludeId, CancellationToken ct = default)
        => _inner.GetConflictsAsync(providerId, start, end, excludeId, ct);

    private static Func<Appointment, bool> MatchesFilters(Dictionary<string, string>? filters)
    {
        if (filters is null || filters.Count == 0)
            return _ => true;

        return a =>
        {
            if (filters.TryGetValue("status", out var status) && a.Status != status)
                return false;
            if (filters.TryGetValue("providerId", out var pid) && Guid.TryParse(pid, out var providerId) && a.ProviderId != providerId)
                return false;
            if (filters.TryGetValue("patientId", out var patId) && Guid.TryParse(patId, out var patientId) && a.PatientId != patientId)
                return false;
            if (filters.TryGetValue("departmentId", out var deptId) && Guid.TryParse(deptId, out var departmentId) && a.DepartmentId != departmentId)
                return false;
            if (filters.TryGetValue("dateFrom", out var df) &&
                DateTime.TryParse(df, null, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dateFrom) &&
                a.ScheduledDateTime < dateFrom)
                return false;
            if (filters.TryGetValue("dateTo", out var dt) &&
                DateTime.TryParse(dt, null, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dateTo) &&
                a.ScheduledDateTime > dateTo)
                return false;
            return true;
        };
    }
}
