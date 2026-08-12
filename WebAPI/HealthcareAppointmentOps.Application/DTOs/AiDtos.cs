namespace HealthcareAppointmentOps.Application.DTOs;

public class ScheduleOptimizationMatchDto
{
    public string WaitlistId { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public double FitScore { get; set; }
}

public class ScheduleOptimizationSuggestionDto
{
    public string Type { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public DateTime ProposedStart { get; set; }
    public DateTime ProposedEnd { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public double EstimatedUtilizationGain { get; set; }
    public double EstimatedNoShowReduction { get; set; }
    public List<ScheduleOptimizationMatchDto> WaitlistMatches { get; set; } = [];
}

public class ScheduleOptimizationDto
{
    public List<ScheduleOptimizationSuggestionDto> Suggestions { get; set; } = [];
    public double Confidence { get; set; }
    public string Explanation { get; set; } = string.Empty;
}

public class AppointmentAutoFillSuggestionDto
{
    public string AppointmentType { get; set; } = string.Empty;
    public Guid ProviderId { get; set; }
    public DateTime ProposedDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public string ReasonForVisit { get; set; } = string.Empty;
}

public class AppointmentAutoFillDto
{
    public AppointmentAutoFillSuggestionDto Suggestions { get; set; } = new();
    public double Confidence { get; set; }
    public string Explanation { get; set; } = string.Empty;
}

public class ScheduleOptimizationRequest
{
    public Guid? ProviderId { get; set; }
    public DateOnly? Date { get; set; }
    public Guid? DepartmentId { get; set; }
}

public class AppointmentSuggestRequest
{
    public Guid PatientId { get; set; }
    public Guid? PreferredDepartmentId { get; set; }
    public string? ReasonHint { get; set; }
}
