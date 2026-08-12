using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models.Dtos;

public class EncounterDto
{
    [JsonPropertyName("encounterId")]
    public string EncounterId { get; set; } = string.Empty;

    [JsonPropertyName("encounterDate")]
    public string EncounterDate { get; set; } = string.Empty;

    [JsonPropertyName("encounterType")]
    public string EncounterType { get; set; } = string.Empty;

    [JsonPropertyName("providerName")]
    public string ProviderName { get; set; } = string.Empty;

    [JsonPropertyName("departmentName")]
    public string DepartmentName { get; set; } = string.Empty;

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("assessment")]
    public string Assessment { get; set; } = string.Empty;

    [JsonPropertyName("plan")]
    public string Plan { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public class VitalReadingDto
{
    [JsonPropertyName("readingDate")]
    public string ReadingDate { get; set; } = string.Empty;

    [JsonPropertyName("metric")]
    public string Metric { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public double Value { get; set; }

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    [JsonPropertyName("referenceRange")]
    public string? ReferenceRange { get; set; }

    [JsonPropertyName("isAbnormal")]
    public bool IsAbnormal { get; set; }
}

public class LabResultDto
{
    [JsonPropertyName("labResultId")]
    public string LabResultId { get; set; } = string.Empty;

    [JsonPropertyName("collectedDate")]
    public string CollectedDate { get; set; } = string.Empty;

    [JsonPropertyName("testName")]
    public string TestName { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public double Value { get; set; }

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    [JsonPropertyName("referenceRange")]
    public string ReferenceRange { get; set; } = string.Empty;

    [JsonPropertyName("isAbnormal")]
    public bool IsAbnormal { get; set; }

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;
}

public class ReferralDto
{
    [JsonPropertyName("referralId")]
    public string ReferralId { get; set; } = string.Empty;

    [JsonPropertyName("requestedDate")]
    public string RequestedDate { get; set; } = string.Empty;

    [JsonPropertyName("specialty")]
    public string Specialty { get; set; } = string.Empty;

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("fromProvider")]
    public string FromProvider { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public class ClinicalHistoryDto
{
    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("encounters")]
    public List<EncounterDto> Encounters { get; set; } = new();

    [JsonPropertyName("vitals")]
    public List<VitalReadingDto> Vitals { get; set; } = new();

    [JsonPropertyName("labs")]
    public List<LabResultDto> Labs { get; set; } = new();

    [JsonPropertyName("referrals")]
    public List<ReferralDto> Referrals { get; set; } = new();
}

public class MedicationDto
{
    [JsonPropertyName("medicationId")]
    public string MedicationId { get; set; } = string.Empty;

    [JsonPropertyName("medicationName")]
    public string MedicationName { get; set; } = string.Empty;

    [JsonPropertyName("dosage")]
    public string Dosage { get; set; } = string.Empty;

    [JsonPropertyName("frequency")]
    public string Frequency { get; set; } = string.Empty;

    [JsonPropertyName("route")]
    public string Route { get; set; } = string.Empty;

    [JsonPropertyName("prescriberName")]
    public string PrescriberName { get; set; } = string.Empty;

    [JsonPropertyName("startDate")]
    public string StartDate { get; set; } = string.Empty;

    [JsonPropertyName("endDate")]
    public string? EndDate { get; set; }

    [JsonPropertyName("stopReason")]
    public string? StopReason { get; set; }

    [JsonPropertyName("refillsRemaining")]
    public int RefillsRemaining { get; set; }

    [JsonPropertyName("pharmacy")]
    public string Pharmacy { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public class MedicationRefillDto
{
    [JsonPropertyName("medicationId")]
    public string MedicationId { get; set; } = string.Empty;

    [JsonPropertyName("medicationName")]
    public string MedicationName { get; set; } = string.Empty;

    [JsonPropertyName("refillDate")]
    public string RefillDate { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public class MedicationHistoryDto
{
    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("active")]
    public List<MedicationDto> Active { get; set; } = new();

    [JsonPropertyName("history")]
    public List<MedicationDto> History { get; set; } = new();

    [JsonPropertyName("adherencePct")]
    public double AdherencePct { get; set; }

    [JsonPropertyName("recentRefills")]
    public List<MedicationRefillDto> RecentRefills { get; set; } = new();
}

public class DocumentDto
{
    [JsonPropertyName("documentId")]
    public string DocumentId { get; set; } = string.Empty;

    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("uploadedDate")]
    public string UploadedDate { get; set; } = string.Empty;

    [JsonPropertyName("providerName")]
    public string ProviderName { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("sizeBytes")]
    public long SizeBytes { get; set; }

    [JsonPropertyName("pageCount")]
    public int PageCount { get; set; }
}

public class CarePlanGoalDto
{
    [JsonPropertyName("goal")]
    public string Goal { get; set; } = string.Empty;

    [JsonPropertyName("target")]
    public string Target { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("progressPct")]
    public double ProgressPct { get; set; }
}

public class CarePlanDto
{
    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("lastUpdated")]
    public string LastUpdated { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("authorName")]
    public string AuthorName { get; set; } = string.Empty;

    [JsonPropertyName("sdoContent")]
    public string SdoContent { get; set; } = string.Empty;

    [JsonPropertyName("goals")]
    public List<CarePlanGoalDto> Goals { get; set; } = new();

    [JsonPropertyName("interventions")]
    public List<string> Interventions { get; set; } = new();

    [JsonPropertyName("followUps")]
    public List<string> FollowUps { get; set; } = new();
}
