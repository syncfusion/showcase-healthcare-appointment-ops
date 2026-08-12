namespace HealthcareAppointmentOps.Application.DTOs;

public class AppointmentSummaryDto
{
    public Guid AppointmentId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientMrn { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderSpecialty { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid DepartmentId { get; set; }
    public Guid LocationId { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public string? RoomNumber { get; set; }
    public string? CheckInSource { get; set; }
}

public class AppointmentDetailDto : AppointmentSummaryDto
{
    public string ReasonForVisit { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string PatientInstructions { get; set; } = string.Empty;
    public string? CancellationReason { get; set; }
    public DateTime CreatedDateTime { get; set; }
    public DateTime? CheckedInDateTime { get; set; }
    public DateTime? CompletedDateTime { get; set; }
}

public class CreateAppointmentRequest
{
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid DepartmentId { get; set; }
    public Guid LocationId { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public DateTime ScheduledDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public string ReasonForVisit { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? PatientInstructions { get; set; }
}

public class UpdateAppointmentRequest : CreateAppointmentRequest
{
    public Guid AppointmentId { get; set; }
}

public class StatusTransitionRequest
{
    public string Status { get; set; } = string.Empty;
}

public class CancelAppointmentRequest
{
    public string? CancellationReason { get; set; }
}

public class CheckInRequest
{
    public string? CheckInSource { get; set; }
}

public class ConflictDto
{
    public Guid AppointmentId { get; set; }
    public Guid ProviderId { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public string Reason { get; set; } = string.Empty;
}
