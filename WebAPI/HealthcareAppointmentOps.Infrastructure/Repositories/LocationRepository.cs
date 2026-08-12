using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class LocationRepository : ILocationRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public LocationRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<List<Location>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Locations.AsNoTracking().ToListAsync(ct);
    }

    public async Task<Location?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Locations.AsNoTracking().FirstOrDefaultAsync(l => l.LocationId == id, ct);
    }
}

public class DepartmentRepository : IDepartmentRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public DepartmentRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<List<Department>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Departments.AsNoTracking()
            .Include(d => d.Location)
            .ToListAsync(ct);
    }

    public async Task<Department?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Departments.AsNoTracking()
            .Include(d => d.Location)
            .FirstOrDefaultAsync(d => d.DepartmentId == id, ct);
    }
}
