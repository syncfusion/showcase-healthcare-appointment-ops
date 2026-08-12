using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models.Dtos;

public class WaitlistEntryDto
{
    [JsonPropertyName("waitlistId")]
    public string WaitlistId { get; set; } = string.Empty;

    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("patientName")]
    public string PatientName { get; set; } = string.Empty;

    [JsonPropertyName("preferredProviderId")]
    public string? PreferredProviderId { get; set; }

    [JsonPropertyName("preferredProviderName")]
    public string? PreferredProviderName { get; set; }

    [JsonPropertyName("preferredDepartmentId")]
    public string PreferredDepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("preferredDepartmentName")]
    public string PreferredDepartmentName { get; set; } = string.Empty;

    [JsonPropertyName("preferredLocationName")]
    public string PreferredLocationName { get; set; } = string.Empty;

    [JsonPropertyName("preferredDateRangeStart")]
    public string PreferredDateRangeStart { get; set; } = string.Empty;

    [JsonPropertyName("preferredDateRangeEnd")]
    public string PreferredDateRangeEnd { get; set; } = string.Empty;

    [JsonPropertyName("priorityScore")]
    public int PriorityScore { get; set; }

    [JsonPropertyName("urgencyLevel")]
    public string UrgencyLevel { get; set; } = string.Empty;

    [JsonPropertyName("requestedAppointmentType")]
    public string RequestedAppointmentType { get; set; } = string.Empty;

    [JsonPropertyName("requestDateTime")]
    public string RequestDateTime { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("matchedAppointmentId")]
    public string? MatchedAppointmentId { get; set; }
}

public class MatchWaitlistRequest
{
    [JsonPropertyName("appointmentId")]
    public string AppointmentId { get; set; } = string.Empty;
}

public class WaitlistMetricsDto
{
    [JsonPropertyName("totalOpen")]
    public int TotalOpen { get; set; }

    [JsonPropertyName("totalMatched")]
    public int TotalMatched { get; set; }

    [JsonPropertyName("totalExpired")]
    public int TotalExpired { get; set; }

    [JsonPropertyName("averagePriorityScore")]
    public double AveragePriorityScore { get; set; }

    [JsonPropertyName("averageWaitDays")]
    public double AverageWaitDays { get; set; }
}

public class AiAppointmentSuggestionDto
{
    [JsonPropertyName("slotStart")]
    public string SlotStart { get; set; } = string.Empty;

    [JsonPropertyName("slotEnd")]
    public string SlotEnd { get; set; } = string.Empty;

    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("providerName")]
    public string ProviderName { get; set; } = string.Empty;

    [JsonPropertyName("locationId")]
    public string LocationId { get; set; } = string.Empty;

    [JsonPropertyName("locationName")]
    public string LocationName { get; set; } = string.Empty;

    [JsonPropertyName("departmentId")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("departmentName")]
    public string DepartmentName { get; set; } = string.Empty;

    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
}

public class ScheduleOptimizationMatchDto
{
    [JsonPropertyName("waitlistId")]
    public string WaitlistId { get; set; } = string.Empty;

    [JsonPropertyName("patientName")]
    public string PatientName { get; set; } = string.Empty;

    [JsonPropertyName("fitScore")]
    public double FitScore { get; set; }
}

public class ScheduleOptimizationSuggestionDto
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("appointmentId")]
    public string? AppointmentId { get; set; }

    [JsonPropertyName("proposedStart")]
    public string ProposedStart { get; set; } = string.Empty;

    [JsonPropertyName("proposedEnd")]
    public string ProposedEnd { get; set; } = string.Empty;

    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("providerName")]
    public string ProviderName { get; set; } = string.Empty;

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("estimatedUtilizationGain")]
    public double EstimatedUtilizationGain { get; set; }

    [JsonPropertyName("estimatedNoShowReduction")]
    public double EstimatedNoShowReduction { get; set; }

    [JsonPropertyName("waitlistMatches")]
    public List<ScheduleOptimizationMatchDto> WaitlistMatches { get; set; } = new();

    public ScheduleOptimizationSuggestionDto WithProposedTimes(string start, string end) => new()
    {
        Type = Type,
        AppointmentId = AppointmentId,
        ProposedStart = start,
        ProposedEnd = end,
        ProviderId = ProviderId,
        ProviderName = ProviderName,
        Reason = Reason,
        EstimatedUtilizationGain = EstimatedUtilizationGain,
        EstimatedNoShowReduction = EstimatedNoShowReduction,
        WaitlistMatches = WaitlistMatches,
    };
}

public class ScheduleOptimizationDto
{
    [JsonPropertyName("suggestions")]
    public List<ScheduleOptimizationSuggestionDto> Suggestions { get; set; } = new();

    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [JsonPropertyName("explanation")]
    public string Explanation { get; set; } = string.Empty;
}

public class ScheduleOptimizationRequest
{
    [JsonPropertyName("providerId")]
    public string? ProviderId { get; set; }

    [JsonPropertyName("date")]
    public string? Date { get; set; }

    [JsonPropertyName("departmentId")]
    public string? DepartmentId { get; set; }
}
