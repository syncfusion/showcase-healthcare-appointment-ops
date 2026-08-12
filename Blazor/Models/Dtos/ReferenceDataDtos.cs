using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models.Dtos;

public class DepartmentDto
{
    [JsonPropertyName("departmentId")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("departmentName")]
    public string DepartmentName { get; set; } = string.Empty;

    [JsonPropertyName("departmentCode")]
    public string DepartmentCode { get; set; } = string.Empty;

    [JsonPropertyName("locationId")]
    public string LocationId { get; set; } = string.Empty;

    [JsonPropertyName("locationName")]
    public string LocationName { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
}

public class LocationDto
{
    [JsonPropertyName("locationId")]
    public string LocationId { get; set; } = string.Empty;

    [JsonPropertyName("locationName")]
    public string LocationName { get; set; } = string.Empty;

    [JsonPropertyName("addressLine")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("postalCode")]
    public string PostalCode { get; set; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("timeZone")]
    public string TimeZone { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
}

public class AuditLogDto
{
    [JsonPropertyName("auditLogId")]
    public string AuditLogId { get; set; } = string.Empty;

    [JsonPropertyName("entityType")]
    public string EntityType { get; set; } = string.Empty;

    [JsonPropertyName("entityId")]
    public string EntityId { get; set; } = string.Empty;

    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty;

    [JsonPropertyName("performedBy")]
    public string PerformedBy { get; set; } = string.Empty;

    [JsonPropertyName("performedAt")]
    public string PerformedAt { get; set; } = string.Empty;

    [JsonPropertyName("details")]
    public System.Text.Json.JsonElement? Details { get; set; }
}

public class PagingRequest
{
    [JsonPropertyName("offset")]
    public int Offset { get; set; }

    [JsonPropertyName("limit")]
    public int Limit { get; set; } = 50;

    [JsonIgnore]
    public int PageNumber => (Offset / Math.Max(1, Limit)) + 1;

    [JsonIgnore]
    public int PageSize => Limit;
}

public class SortingRequest
{
    public string SortBy { get; set; } = string.Empty;
    public bool Descending { get; set; }
}

public class PatientFilterRequest
{
    public string? Search { get; set; }
    public string? Gender { get; set; }
    public string? Status { get; set; }
    public string? ProviderId { get; set; }
}

public class AppointmentFilterRequest
{
    [JsonPropertyName("patientId")]
    public string? PatientId { get; set; }

    [JsonPropertyName("providerId")]
    public string? ProviderId { get; set; }

    [JsonPropertyName("departmentId")]
    public string? DepartmentId { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("from")]
    public string? FromDate { get; set; }

    [JsonPropertyName("to")]
    public string? ToDate { get; set; }
}
