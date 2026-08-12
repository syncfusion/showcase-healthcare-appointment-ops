using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Infrastructure.Persistence;

namespace HealthcareAppointmentOps.Infrastructure.Repositories.Overlay;

/// <summary>
/// Read-only-demo overlay wrapper for <see cref="AuditLogRepository"/>. Audit entries
/// written as a side effect of session actions are held in memory and surfaced in the
/// audit list, so the trail reflects what the visitor did without persisting anything.
/// </summary>
public sealed class OverlayAuditLogRepository : IAuditLogRepository
{
    private readonly AuditLogRepository _inner;
    private readonly IInMemoryOverrideStore<AuditLogEntry, Guid> _store;
    private readonly IDemoSessionAccessor _session;

    public OverlayAuditLogRepository(
        AuditLogRepository inner,
        IInMemoryOverrideStore<AuditLogEntry, Guid> store,
        IDemoSessionAccessor session)
    {
        _inner = inner;
        _store = store;
        _session = session;
    }

    private string S => _session.SessionKey;

    public Task AddAsync(AuditLogEntry entry, CancellationToken ct = default)
    {
        _store.Upsert(S, entry.AuditId, entry);
        return Task.CompletedTask;
    }

    public async Task<(List<AuditLogEntry> Items, int Total)> ListAsync(string? entityType, Guid? entityId, int offset, int limit, CancellationToken ct = default)
    {
        var (items, total) = await _inner.ListAsync(entityType, entityId, offset, limit, ct);
        var merged = _store.Merge(S, items, a => a.AuditId, MatchesFilters(entityType, entityId))
            .OrderByDescending(a => a.PerformedAt)
            .ToList();
        var delta = merged.Count - items.Count;
        return (merged, Math.Max(0, total + delta));
    }

    private static Func<AuditLogEntry, bool> MatchesFilters(string? entityType, Guid? entityId)
        => a =>
        {
            if (!string.IsNullOrWhiteSpace(entityType) && a.EntityType != entityType)
                return false;
            if (entityId.HasValue && a.EntityId != entityId.Value)
                return false;
            return true;
        };
}
