using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class ProviderRepository : IProviderRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public ProviderRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<Provider?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Providers
            .Include(p => p.Department)
            .Include(p => p.Location)
            .Include(p => p.ScheduleTemplates)
            .FirstOrDefaultAsync(p => p.ProviderId == id, ct);
    }

    public async Task<(List<Provider> Items, int Total)> ListAsync(Guid? departmentId, string? specialty, int offset, int limit, CancellationToken ct = default)
    {
        var q = _context.Providers.AsNoTracking()
            .Include(p => p.Department)
            .Include(p => p.Location)
            .AsQueryable();
        if (departmentId.HasValue)
            q = q.Where(p => p.DepartmentId == departmentId.Value);
        if (!string.IsNullOrWhiteSpace(specialty))
            q = q.Where(p => p.Specialty == specialty);
        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(p => p.LastName).Skip(offset).Take(limit).ToListAsync(ct);
        return (items, total);
    }

    public async Task<List<Provider>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Providers.AsNoTracking()
            .Include(p => p.Department)
            .Include(p => p.Location)
            .ToListAsync(ct);
    }
}
