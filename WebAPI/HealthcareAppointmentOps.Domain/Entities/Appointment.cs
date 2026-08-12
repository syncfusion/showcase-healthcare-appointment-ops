namespace HealthcareAppointmentOps.Domain.Entities;

public class Appointment
{
    public Guid AppointmentId { get; set; }
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid DepartmentId { get; set; }
    public Guid LocationId { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = "Scheduled";
    public DateTime ScheduledDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public string ReasonForVisit { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string PatientInstructions { get; set; } = string.Empty;
    public string? CancellationReason { get; set; }
    public DateTime CreatedDateTime { get; set; }
    public DateTime? CheckedInDateTime { get; set; }
    public DateTime? CompletedDateTime { get; set; }
    public string? RoomNumber { get; set; }
    public string? CheckInSource { get; set; }

    public Patient Patient { get; set; } = null!;
    public Provider Provider { get; set; } = null!;
    public Department Department { get; set; } = null!;
    public Location Location { get; set; } = null!;
    public WaitlistEntry? MatchedWaitlistEntry { get; set; }
}
