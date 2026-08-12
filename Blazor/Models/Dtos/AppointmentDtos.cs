using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models.Dtos;

public enum AppointmentStatus
{
    Scheduled,
    Confirmed,
    CheckedIn,
    InProgress,
    Completed,
    Cancelled,
    NoShow
}

public class AppointmentSummaryDto
{
    [JsonPropertyName("appointmentId")]
    public string AppointmentId { get; set; } = string.Empty;

    [JsonPropertyName("patientName")]
    public string PatientName { get; set; } = string.Empty;

    [JsonPropertyName("patientMrn")]
    public string PatientMrn { get; set; } = string.Empty;

    [JsonPropertyName("providerName")]
    public string ProviderName { get; set; } = string.Empty;

    [JsonPropertyName("providerSpecialty")]
    public string ProviderSpecialty { get; set; } = string.Empty;

    [JsonPropertyName("departmentName")]
    public string DepartmentName { get; set; } = string.Empty;

    [JsonPropertyName("locationName")]
    public string LocationName { get; set; } = string.Empty;

    [JsonPropertyName("appointmentType")]
    public string AppointmentType { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public AppointmentStatus Status { get; set; }

    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("departmentId")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("locationId")]
    public string LocationId { get; set; } = string.Empty;

    [JsonPropertyName("scheduledDateTime")]
    public string ScheduledDateTime { get; set; } = string.Empty;

    [JsonPropertyName("durationMinutes")]
    public int DurationMinutes { get; set; }

    [JsonPropertyName("roomNumber")]
    public string? RoomNumber { get; set; }

    [JsonPropertyName("checkInSource")]
    public string? CheckInSource { get; set; }
}

public class AppointmentDetailDto : AppointmentSummaryDto
{
    [JsonPropertyName("reasonForVisit")]
    public string ReasonForVisit { get; set; } = string.Empty;

    [JsonPropertyName("notes")]
    public string Notes { get; set; } = string.Empty;

    [JsonPropertyName("patientInstructions")]
    public string PatientInstructions { get; set; } = string.Empty;

    [JsonPropertyName("cancellationReason")]
    public string? CancellationReason { get; set; }

    [JsonPropertyName("createdDateTime")]
    public string CreatedDateTime { get; set; } = string.Empty;

    [JsonPropertyName("checkedInDateTime")]
    public string? CheckedInDateTime { get; set; }

    [JsonPropertyName("completedDateTime")]
    public string? CompletedDateTime { get; set; }
}

public class CreateAppointmentRequest
{
    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("departmentId")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("locationId")]
    public string LocationId { get; set; } = string.Empty;

    [JsonPropertyName("appointmentType")]
    public string AppointmentType { get; set; } = string.Empty;

    [JsonPropertyName("scheduledDateTime")]
    public string ScheduledDateTime { get; set; } = string.Empty;

    [JsonPropertyName("durationMinutes")]
    public int DurationMinutes { get; set; }

    [JsonPropertyName("reasonForVisit")]
    public string ReasonForVisit { get; set; } = string.Empty;

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("patientInstructions")]
    public string? PatientInstructions { get; set; }
}

public class UpdateAppointmentRequest : CreateAppointmentRequest
{
    [JsonPropertyName("appointmentId")]
    public string AppointmentId { get; set; } = string.Empty;
}

public class StatusTransitionRequest
{
    [JsonPropertyName("status")]
    public AppointmentStatus Status { get; set; }
}

public class ConflictDto
{
    [JsonPropertyName("appointmentId")]
    public string AppointmentId { get; set; } = string.Empty;

    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("scheduledDateTime")]
    public string ScheduledDateTime { get; set; } = string.Empty;

    [JsonPropertyName("durationMinutes")]
    public int DurationMinutes { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
}
