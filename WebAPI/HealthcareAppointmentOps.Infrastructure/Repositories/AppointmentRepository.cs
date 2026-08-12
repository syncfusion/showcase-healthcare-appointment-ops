using System.Globalization;
using HealthcareAppointmentOps.Domain.Entities;
using HealthcareAppointmentOps.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly Persistence.HealthcareDbContext _context;

    public AppointmentRepository(Persistence.HealthcareDbContext context)
    {
        _context = context;
    }

    // ScheduledDateTime is mapped to PostgreSQL 'timestamp with time zone', which
    // Npgsql will only bind from a DateTime with Kind=Utc. Callers often supply
    // values derived from DateOnly (Kind=Unspecified) or local time, so coerce any
    // incoming DateTime to UTC before it reaches a query parameter.
    private static DateTime ToUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
    };

    public async Task<Appointment?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Include(a => a.Department)
            .Include(a => a.Location)
            .FirstOrDefaultAsync(a => a.AppointmentId == id, ct);
    }

    public async Task<(List<Appointment> Items, int Total)> ListAsync(Dictionary<string, string>? filters, int offset, int limit, CancellationToken ct = default)
    {
        var q = _context.Appointments.AsNoTracking()
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Include(a => a.Department)
            .Include(a => a.Location)
            .AsQueryable();

        if (filters != null)
        {
            if (filters.TryGetValue("status", out var status))
                q = q.Where(a => a.Status == status);
            if (filters.TryGetValue("providerId", out var pid) && Guid.TryParse(pid, out var providerId))
                q = q.Where(a => a.ProviderId == providerId);
            if (filters.TryGetValue("patientId", out var patId) && Guid.TryParse(patId, out var patientId))
                q = q.Where(a => a.PatientId == patientId);
            if (filters.TryGetValue("departmentId", out var deptId) && Guid.TryParse(deptId, out var departmentId))
                q = q.Where(a => a.DepartmentId == departmentId);
            if (filters.TryGetValue("dateFrom", out var df) && DateTime.TryParse(df, null, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dateFrom))
                q = q.Where(a => a.ScheduledDateTime >= dateFrom);
            if (filters.TryGetValue("dateTo", out var dt) && DateTime.TryParse(dt, null, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dateTo))
                q = q.Where(a => a.ScheduledDateTime <= dateTo);
        }

        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(a => a.ScheduledDateTime)
            .Skip(offset).Take(limit).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(Appointment appointment, CancellationToken ct = default)
    {
        await _context.Appointments.AddAsync(appointment, ct);
    }

    public void Update(Appointment appointment)
    {
        _context.Appointments.Update(appointment);
    }

    public async Task<List<Appointment>> GetByPatientIdAsync(Guid patientId, CancellationToken ct = default)
    {
        return await _context.Appointments.AsNoTracking()
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Include(a => a.Department)
            .Include(a => a.Location)
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.ScheduledDateTime)
            .ToListAsync(ct);
    }

    public async Task<List<Appointment>> GetByPatientIdsAsync(IReadOnlyCollection<Guid> patientIds, CancellationToken ct = default)
    {
        // Defensive: EF translates an empty Contains into SQL that returns all rows.
        // Short-circuit when the caller has no patient ids to avoid a full table scan.
        if (patientIds.Count == 0)
            return new List<Appointment>();

        return await _context.Appointments.AsNoTracking()
            .Where(a => patientIds.Contains(a.PatientId))
            .ToListAsync(ct);
    }

    public async Task<List<Appointment>> GetByProviderIdAsync(Guid providerId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        from = ToUtc(from);
        to = ToUtc(to);
        return await _context.Appointments.AsNoTracking()
            .Where(a => a.ProviderId == providerId && a.ScheduledDateTime >= from && a.ScheduledDateTime < to)
            .OrderBy(a => a.ScheduledDateTime)
            .ToListAsync(ct);
    }

    public async Task<List<Appointment>> GetConflictsAsync(Guid providerId, DateTime start, DateTime end, Guid? excludeId, CancellationToken ct = default)
    {
        start = ToUtc(start);
        end = ToUtc(end);
        var q = _context.Appointments.AsNoTracking()
            .Where(a => a.ProviderId == providerId &&
                        a.ScheduledDateTime < end &&
                        a.ScheduledDateTime.AddMinutes(a.DurationMinutes) > start &&
                        a.Status != "Cancelled" && a.Status != "NoShow");
        if (excludeId.HasValue)
            q = q.Where(a => a.AppointmentId != excludeId.Value);
        return await q.ToListAsync(ct);
    }

    public async Task<List<Appointment>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken ct = default)
    {
        from = ToUtc(from);
        to = ToUtc(to);
        return await _context.Appointments.AsNoTracking()
            .Include(a => a.Provider)
            .Include(a => a.Department)
            .Where(a => a.ScheduledDateTime >= from && a.ScheduledDateTime < to)
            .ToListAsync(ct);
    }
}
