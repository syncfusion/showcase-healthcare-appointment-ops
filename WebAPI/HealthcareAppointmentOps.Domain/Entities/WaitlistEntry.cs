namespace HealthcareAppointmentOps.Domain.Entities;

public class WaitlistEntry
{
    public Guid WaitlistId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? PreferredProviderId { get; set; }
    public Guid PreferredDepartmentId { get; set; }
    public DateOnly PreferredDateRangeStart { get; set; }
    public DateOnly PreferredDateRangeEnd { get; set; }
    public int PriorityScore { get; set; }
    public string UrgencyLevel { get; set; } = "Routine";
    public string RequestedAppointmentType { get; set; } = string.Empty;
    public DateTime RequestDateTime { get; set; }
    public string Status { get; set; } = "Open";
    public Guid? MatchedAppointmentId { get; set; }

    public Patient Patient { get; set; } = null!;
    public Provider? PreferredProvider { get; set; }
    public Department PreferredDepartment { get; set; } = null!;
    public Appointment? MatchedAppointment { get; set; }
}
