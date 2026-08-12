using HealthcareAppointmentOps.Application.Abstractions;

namespace HealthcareAppointmentOps.Infrastructure.Persistence;

/// <summary>
/// Used in the read-only public demo: swallows SaveChanges so nothing the
/// controllers write ever reaches PostgreSQL. Mutations are captured by the
/// overlay repositories instead (see <see cref="InMemoryOverrideStore{TEntity, TKey}"/>).
/// </summary>
public sealed class NoOpUnitOfWork : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(0);
}
