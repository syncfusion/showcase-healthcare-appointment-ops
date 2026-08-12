using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public DocumentRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<List<Document>> GetByPatientIdAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.Documents.AsNoTracking()
            .Where(x => x.PatientId == patientId)
            .OrderByDescending(x => x.UploadedDate)
            .ToListAsync(ct);
    }

    public async Task<CarePlan?> GetCarePlanAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.CarePlans.AsNoTracking()
            .Include(x => x.Goals)
            .FirstOrDefaultAsync(x => x.PatientId == patientId, ct);
    }
}
