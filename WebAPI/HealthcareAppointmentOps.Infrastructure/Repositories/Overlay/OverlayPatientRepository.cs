using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Infrastructure.Persistence;

namespace HealthcareAppointmentOps.Infrastructure.Repositories.Overlay;

/// <summary>
/// Read-only-demo overlay wrapper for <see cref="PatientRepository"/>: creates and
/// updates are held per-session in memory and merged onto database reads.
/// </summary>
public sealed class OverlayPatientRepository : IPatientRepository
{
    private readonly PatientRepository _inner;
    private readonly IInMemoryOverrideStore<Patient, Guid> _store;
    private readonly IDemoSessionAccessor _session;

    public OverlayPatientRepository(
        PatientRepository inner,
        IInMemoryOverrideStore<Patient, Guid> store,
        IDemoSessionAccessor session)
    {
        _inner = inner;
        _store = store;
        _session = session;
    }

    private string S => _session.SessionKey;

    public async Task<Patient?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        if (_store.TryGet(S, id, out var overlaid, out var deleted))
            return deleted ? null : overlaid;
        return await _inner.GetByIdAsync(id, ct);
    }

    public async Task<(List<Patient> Items, int Total)> ListAsync(string? query, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _inner.ListAsync(query, offset, limit, ct);
        var merged = _store.Merge(S, items, p => p.PatientId, MatchesQuery(query))
            .OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
            .ToList();
        var delta = merged.Count - items.Count;
        return (merged, Math.Max(0, total + delta));
    }

    public Task<Patient?> GetByMrnAsync(string mrn, CancellationToken ct = default)
        => _inner.GetByMrnAsync(mrn, ct);

    public Task AddAsync(Patient patient, CancellationToken ct = default)
    {
        _store.Upsert(S, patient.PatientId, patient);
        return Task.CompletedTask;
    }

    public void Update(Patient patient)
        => _store.Upsert(S, patient.PatientId, patient);

    public Task<List<Patient>> GetByProviderIdAsync(Guid providerId, CancellationToken ct = default)
        => _inner.GetByProviderIdAsync(providerId, ct);

    private static Func<Patient, bool> MatchesQuery(string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return _ => true;

        var lower = query.ToLowerInvariant();
        return p =>
            ($"{p.FirstName} {p.LastName}").ToLowerInvariant().Contains(lower) ||
            p.MedicalRecordNumber.ToLowerInvariant().Contains(lower);
    }
}
