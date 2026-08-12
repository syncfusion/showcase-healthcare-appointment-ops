using HealthcareAppointmentOps.Application.Abstractions;

namespace HealthcareAppointmentOps.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly HealthcareDbContext _context;

    public UnitOfWork(HealthcareDbContext context)
    {
        _context = context;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return _context.SaveChangesAsync(ct);
    }
}
