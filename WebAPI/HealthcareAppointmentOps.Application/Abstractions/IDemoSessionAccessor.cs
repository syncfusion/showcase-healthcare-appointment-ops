namespace HealthcareAppointmentOps.Application.Abstractions;

/// <summary>
/// Resolves the current request's demo-session token. Used to isolate each
/// visitor's in-memory overlay of changes in the read-only public demo, so one
/// visitor's edits are never visible to another.
/// </summary>
public interface IDemoSessionAccessor
{
    string SessionKey { get; }
}
