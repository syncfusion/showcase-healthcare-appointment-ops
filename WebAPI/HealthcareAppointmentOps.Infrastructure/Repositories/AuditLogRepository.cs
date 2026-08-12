using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public AuditLogRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AuditLogEntry entry, CancellationToken ct = default)
    {
        await _context.AuditLogEntries.AddAsync(entry, ct);
    }

    public async Task<(List<AuditLogEntry> Items, int Total)> ListAsync(string? entityType, Guid? entityId, int offset, int limit, CancellationToken ct = default)
    {
        var q = _context.AuditLogEntries.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(entityType))
            q = q.Where(a => a.EntityType == entityType);
        if (entityId.HasValue)
            q = q.Where(a => a.EntityId == entityId.Value);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(a => a.PerformedAt)
            .Skip(offset).Take(limit).ToListAsync(ct);
        return (items, total);
    }
}
