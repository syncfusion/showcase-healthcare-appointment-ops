namespace HealthcareAppointmentOps.Domain.Entities;

public class AuditLogEntry
{
    public Guid AuditId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime PerformedAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string Details { get; set; } = "{}";
}
