using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models.Dtos;

public class ProviderSummaryDto
{
    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("npiNumber")]
    public string NpiNumber { get; set; } = string.Empty;

    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("specialty")]
    public string Specialty { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("departmentId")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("departmentName")]
    public string DepartmentName { get; set; } = string.Empty;

    [JsonPropertyName("locationId")]
    public string LocationId { get; set; } = string.Empty;

    [JsonPropertyName("locationName")]
    public string LocationName { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("averageAppointmentDuration")]
    public int AverageAppointmentDuration { get; set; }
}

public class ProviderDetailDto : ProviderSummaryDto
{
}

public class ScheduleTemplateDto
{
    [JsonPropertyName("templateId")]
    public string TemplateId { get; set; } = string.Empty;

    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("departmentId")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("locationId")]
    public string LocationId { get; set; } = string.Empty;

    [JsonPropertyName("dayOfWeek")]
    public int DayOfWeek { get; set; }

    [JsonPropertyName("startTime")]
    public string StartTime { get; set; } = string.Empty;

    [JsonPropertyName("endTime")]
    public string EndTime { get; set; } = string.Empty;

    [JsonPropertyName("slotDuration")]
    public int SlotDuration { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("effectiveFrom")]
    public string EffectiveFrom { get; set; } = string.Empty;

    [JsonPropertyName("effectiveTo")]
    public string? EffectiveTo { get; set; }
}

public class SlotDto
{
    [JsonPropertyName("slotStart")]
    public string SlotStart { get; set; } = string.Empty;

    [JsonPropertyName("slotEnd")]
    public string SlotEnd { get; set; } = string.Empty;

    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("providerName")]
    public string ProviderName { get; set; } = string.Empty;

    [JsonPropertyName("isAvailable")]
    public bool IsAvailable { get; set; }

    [JsonPropertyName("locationId")]
    public string LocationId { get; set; } = string.Empty;
}
