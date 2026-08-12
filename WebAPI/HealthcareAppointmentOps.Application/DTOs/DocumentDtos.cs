namespace HealthcareAppointmentOps.Application.DTOs;

// ─────────────────────────────────────────────────────────────────────────────
// Document Center + Care Plan + AI
// Read-only seeded demo data; no new database tables.
// ─────────────────────────────────────────────────────────────────────────────

public class DocumentDto
{
    public Guid DocumentId { get; set; }
    public Guid PatientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Insurance Card, Referral Letter, Lab Report, Discharge Summary, Procedure Report, Consent Form, Imaging Report
    public DateTime UploadedDate { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Final, Draft, Pending Review
    public string Url { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int PageCount { get; set; }
}

public class DocumentPdfContent
{
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public int PageCount { get; set; }
    public long SizeBytes { get; set; }
}

public class CarePlanDto
{
    public Guid PatientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
    public string Version { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string SdoContent { get; set; } = string.Empty; // Syncfusion Document Editor native format (text fallback)
    public List<CarePlanGoalDto> Goals { get; set; } = [];
    public List<string> Interventions { get; set; } = [];
    public List<string> FollowUps { get; set; } = [];
}

public class CarePlanGoalDto
{
    public string Goal { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // In Progress, Achieved, Not Started
    public double ProgressPct { get; set; }
}

// AI workflow result shape — mirrors existing ScheduleOptimizationDto confidendence/explanation pattern
public class LabSummaryResultDto
{
    public string Summary { get; set; } = string.Empty;
    public List<LabSummaryRecommendationDto> Recommendations { get; set; } = [];
    public double Confidence { get; set; }
    public string Explanation { get; set; } = string.Empty;
}

public class LabSummaryRecommendationDto
{
    public string Title { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty; // Info, Warning, Critical
}

public class SummarizeDocumentRequest
{
    public Guid DocumentId { get; set; }
}

public class CarePlanDraftResultDto
{
    public string SdoContent { get; set; } = string.Empty; // editable document content (text fallback)
    public double Confidence { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public List<string> GeneratedSections { get; set; } = [];
}
