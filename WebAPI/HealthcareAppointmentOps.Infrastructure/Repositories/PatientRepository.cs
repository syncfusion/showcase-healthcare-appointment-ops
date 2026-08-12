using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class PatientRepository : IPatientRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public PatientRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<Patient?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Patients
            .Include(p => p.PrimaryCareProvider)
                .ThenInclude(pr => pr!.Location)
            .Include(p => p.PrimaryCareProvider)
                .ThenInclude(pr => pr!.Department)
            .FirstOrDefaultAsync(p => p.PatientId == id, ct);
    }

    public async Task<Patient?> GetByMrnAsync(string mrn, CancellationToken ct = default)
    {
        return await _context.Patients
            .FirstOrDefaultAsync(p => p.MedicalRecordNumber == mrn, ct);
    }

    public async Task<(List<Patient> Items, int Total)> ListAsync(string? query, int offset, int limit, CancellationToken ct = default)
    {
        var q = _context.Patients.AsNoTracking().Include(p => p.PrimaryCareProvider).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var lower = query.ToLowerInvariant();
            q = q.Where(p =>
                (p.FirstName + " " + p.LastName).ToLower().Contains(lower) ||
                p.MedicalRecordNumber.ToLower().Contains(lower));
        }
        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
            .Skip(offset).Take(limit).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(Patient patient, CancellationToken ct = default)
    {
        await _context.Patients.AddAsync(patient, ct);
    }

    public void Update(Patient patient)
    {
        _context.Patients.Update(patient);
    }

    public async Task<List<Patient>> GetByProviderIdAsync(Guid providerId, CancellationToken ct = default)
    {
        return await _context.Patients
            .Where(p => p.PrimaryCareProviderId == providerId)
            .ToListAsync(ct);
    }
}
