using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class ClinicalHistoryRepository : IClinicalHistoryRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public ClinicalHistoryRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<List<Encounter>> GetEncountersAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.Encounters.AsNoTracking()
            .Where(x => x.PatientId == patientId)
            .OrderByDescending(x => x.EncounterDate)
            .ToListAsync(ct);
    }

    public async Task<List<VitalReading>> GetVitalsAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.VitalReadings.AsNoTracking()
            .Where(x => x.PatientId == patientId)
            .OrderBy(x => x.ReadingDate)
            .ToListAsync(ct);
    }

    public async Task<List<LabResult>> GetLabsAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.LabResults.AsNoTracking()
            .Where(x => x.PatientId == patientId)
            .OrderByDescending(x => x.CollectedDate)
            .ToListAsync(ct);
    }

    public async Task<List<Referral>> GetReferralsAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.Referrals.AsNoTracking()
            .Where(x => x.PatientId == patientId)
            .OrderByDescending(x => x.RequestedDate)
            .ToListAsync(ct);
    }
}
