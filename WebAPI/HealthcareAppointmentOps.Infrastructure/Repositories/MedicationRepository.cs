using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class MedicationRepository : IMedicationRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public MedicationRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<List<Medication>> GetByPatientIdAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.Medications.AsNoTracking()
            .Where(x => x.PatientId == patientId)
            .OrderByDescending(x => x.StartDate)
            .ToListAsync(ct);
    }

    public async Task<List<MedicationRefill>> GetRefillsByPatientIdAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.MedicationRefills.AsNoTracking()
            .Where(x => x.PatientId == patientId)
            .OrderByDescending(x => x.RefillDate)
            .ToListAsync(ct);
    }
}
