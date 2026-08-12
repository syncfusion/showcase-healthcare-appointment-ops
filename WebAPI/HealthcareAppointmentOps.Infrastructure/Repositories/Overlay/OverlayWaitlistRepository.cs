using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Infrastructure.Persistence;

namespace HealthcareAppointmentOps.Infrastructure.Repositories.Overlay;

/// <summary>
/// Read-only-demo overlay wrapper for <see cref="WaitlistRepository"/>: matches and
/// removals are held per-session in memory and merged onto database reads.
/// </summary>
public sealed class OverlayWaitlistRepository : IWaitlistRepository
{
    private readonly WaitlistRepository _inner;
    private readonly IInMemoryOverrideStore<WaitlistEntry, Guid> _store;
    private readonly IDemoSessionAccessor _session;

    public OverlayWaitlistRepository(
        WaitlistRepository inner,
        IInMemoryOverrideStore<WaitlistEntry, Guid> store,
        IDemoSessionAccessor session)
    {
        _inner = inner;
        _store = store;
        _session = session;
    }

    private string S => _session.SessionKey;

    public async Task<WaitlistEntry?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        if (_store.TryGet(S, id, out var overlaid, out var deleted))
            return deleted ? null : overlaid;
        return await _inner.GetByIdAsync(id, ct);
    }

    public async Task<(List<WaitlistEntry> Items, int Total)> ListAsync(string? status, Guid? departmentId, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _inner.ListAsync(status, departmentId, offset, limit, ct);
        var merged = _store.Merge(S, items, w => w.WaitlistId, MatchesFilters(status, departmentId))
            .OrderByDescending(w => w.PriorityScore).ThenBy(w => w.RequestDateTime)
            .ToList();
        var delta = merged.Count - items.Count;
        return (merged, Math.Max(0, total + delta));
    }

    public Task AddAsync(WaitlistEntry entry, CancellationToken ct = default)
    {
        _store.Upsert(S, entry.WaitlistId, entry);
        return Task.CompletedTask;
    }

    public void Update(WaitlistEntry entry)
        => _store.Upsert(S, entry.WaitlistId, entry);

    public void Remove(WaitlistEntry entry)
        => _store.Tombstone(S, entry.WaitlistId);

    // Aggregate metrics stay database-only in the demo.
    public Task<WaitlistMetricsDto> GetMetricsAsync(CancellationToken ct = default)
        => _inner.GetMetricsAsync(ct);

    private static Func<WaitlistEntry, bool> MatchesFilters(string? status, Guid? departmentId)
        => w =>
        {
            if (!string.IsNullOrWhiteSpace(status) && w.Status != status)
                return false;
            if (departmentId.HasValue && w.PreferredDepartmentId != departmentId.Value)
                return false;
            return true;
        };
}
