using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class ScheduleTemplateRepository : IScheduleTemplateRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public ScheduleTemplateRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<List<ScheduleTemplate>> GetByProviderIdAsync(Guid providerId, CancellationToken ct = default)
    {
        return await _context.ScheduleTemplates.AsNoTracking()
            .Where(t => t.ProviderId == providerId)
            .OrderBy(t => t.DayOfWeek).ThenBy(t => t.StartTime)
            .ToListAsync(ct);
    }

    public async Task<ScheduleTemplate?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.ScheduleTemplates.AsNoTracking()
            .FirstOrDefaultAsync(t => t.TemplateId == id, ct);
    }

    public async Task AddAsync(ScheduleTemplate template, CancellationToken ct = default)
    {
        await _context.ScheduleTemplates.AddAsync(template, ct);
    }

    public void Update(ScheduleTemplate template)
    {
        _context.ScheduleTemplates.Update(template);
    }
}
