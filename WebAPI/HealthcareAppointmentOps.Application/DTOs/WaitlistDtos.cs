namespace HealthcareAppointmentOps.Application.DTOs;

public class WaitlistEntryDto
{
    public Guid WaitlistId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid? PreferredProviderId { get; set; }
    public string? PreferredProviderName { get; set; }
    public Guid PreferredDepartmentId { get; set; }
    public string PreferredDepartmentName { get; set; } = string.Empty;
    public string PreferredLocationName { get; set; } = string.Empty;
    public DateOnly PreferredDateRangeStart { get; set; }
    public DateOnly PreferredDateRangeEnd { get; set; }
    public int PriorityScore { get; set; }
    public string UrgencyLevel { get; set; } = string.Empty;
    public string RequestedAppointmentType { get; set; } = string.Empty;
    public DateTime RequestDateTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? MatchedAppointmentId { get; set; }
}

public class CreateWaitlistRequest
{
    public Guid PatientId { get; set; }
    public Guid? PreferredProviderId { get; set; }
    public Guid PreferredDepartmentId { get; set; }
    public DateOnly PreferredDateRangeStart { get; set; }
    public DateOnly PreferredDateRangeEnd { get; set; }
    public string UrgencyLevel { get; set; } = "Routine";
    public string RequestedAppointmentType { get; set; } = string.Empty;
}

public class WaitlistMetricsDto
{
    public int TotalOpen { get; set; }
    public int TotalMatched { get; set; }
    public int TotalExpired { get; set; }
    public double AveragePriorityScore { get; set; }
    public double AverageWaitDays { get; set; }
}

public class MatchWaitlistRequest
{
    public Guid AppointmentId { get; set; }
}
