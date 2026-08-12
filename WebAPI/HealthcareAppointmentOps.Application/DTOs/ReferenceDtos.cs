namespace HealthcareAppointmentOps.Application.DTOs;

public class DepartmentDto
{
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public Guid LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class LocationDto
{
    public Guid LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string TimeZone { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class AuditLogEntryDto
{
    public Guid AuditId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime PerformedAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public Dictionary<string, object> Details { get; set; } = [];
}
