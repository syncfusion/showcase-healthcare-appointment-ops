using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class WaitlistRepository : IWaitlistRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public WaitlistRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<WaitlistEntry?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.WaitlistEntries
            .Include(w => w.Patient)
            .Include(w => w.PreferredProvider)
            .Include(w => w.PreferredDepartment)
                .ThenInclude(d => d.Location)
            .FirstOrDefaultAsync(w => w.WaitlistId == id, ct);
    }

    public async Task<(List<WaitlistEntry> Items, int Total)> ListAsync(string? status, Guid? departmentId, int offset, int limit, CancellationToken ct = default)
    {
        var q = _context.WaitlistEntries.AsNoTracking()
            .Include(w => w.Patient)
            .Include(w => w.PreferredProvider)
            .Include(w => w.PreferredDepartment)
                .ThenInclude(d => d.Location)
            .AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(w => w.Status == status);
        if (departmentId.HasValue)
            q = q.Where(w => w.PreferredDepartmentId == departmentId.Value);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(w => w.PriorityScore).ThenBy(w => w.RequestDateTime)
            .Skip(offset).Take(limit).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(WaitlistEntry entry, CancellationToken ct = default)
    {
        await _context.WaitlistEntries.AddAsync(entry, ct);
    }

    public void Update(WaitlistEntry entry)
    {
        _context.WaitlistEntries.Update(entry);
    }

    public void Remove(WaitlistEntry entry)
    {
        _context.WaitlistEntries.Remove(entry);
    }

    public async Task<WaitlistMetricsDto> GetMetricsAsync(CancellationToken ct = default)
    {
        var openCount = await _context.WaitlistEntries.CountAsync(w => w.Status == "Open", ct);
        var matchedCount = await _context.WaitlistEntries.CountAsync(w => w.Status == "Matched", ct);
        var expiredCount = await _context.WaitlistEntries.CountAsync(w => w.Status == "ClosedExpired", ct);
        var avgPriority = await _context.WaitlistEntries.Where(w => w.Status == "Open").AverageAsync(w => (double?)w.PriorityScore, ct) ?? 0;
        var avgWait = await _context.WaitlistEntries.Where(w => w.Status == "Open")
            .AverageAsync(w => (double?)(DateTime.UtcNow - w.RequestDateTime).TotalDays, ct) ?? 0;

        return new WaitlistMetricsDto
        {
            TotalOpen = openCount,
            TotalMatched = matchedCount,
            TotalExpired = expiredCount,
            AveragePriorityScore = avgPriority,
            AverageWaitDays = avgWait
        };
    }
}
