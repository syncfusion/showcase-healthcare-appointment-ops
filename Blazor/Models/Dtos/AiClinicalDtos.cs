using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models.Dtos;

public class LabSummaryRecommendationDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("rationale")]
    public string Rationale { get; set; } = string.Empty;

    [JsonPropertyName("severity")]
    public string Severity { get; set; } = string.Empty;
}

public class LabSummaryResultDto
{
    [JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;

    [JsonPropertyName("recommendations")]
    public List<LabSummaryRecommendationDto> Recommendations { get; set; } = new();

    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [JsonPropertyName("explanation")]
    public string Explanation { get; set; } = string.Empty;
}

public class CarePlanDraftResultDto
{
    [JsonPropertyName("sdoContent")]
    public string SdoContent { get; set; } = string.Empty;

    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [JsonPropertyName("explanation")]
    public string Explanation { get; set; } = string.Empty;

    [JsonPropertyName("generatedSections")]
    public List<string> GeneratedSections { get; set; } = new();
}

public class SummarizeDocumentRequest
{
    [JsonPropertyName("documentId")]
    public string DocumentId { get; set; } = string.Empty;
}
