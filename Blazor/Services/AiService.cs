using HealthcareAppointmentOps.Blazor.Models;
using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Services;

public class AiAppointmentSuggestionItemDto
{
    [System.Text.Json.Serialization.JsonPropertyName("appointmentType")]
    public string AppointmentType { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("proposedDateTime")]
    public string ProposedDateTime { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("durationMinutes")]
    public int DurationMinutes { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("reasonForVisit")]
    public string ReasonForVisit { get; set; } = string.Empty;
}

public class AiAppointmentSuggestionResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("suggestions")]
    public AiAppointmentSuggestionItemDto? Suggestions { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("explanation")]
    public string Explanation { get; set; } = string.Empty;
}

public class AiAppointmentSuggestionRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("preferredDepartmentId")]
    public string? PreferredDepartmentId { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("reasonHint")]
    public string? ReasonHint { get; set; }
}

public class AiService
{
    private readonly ApiClient _apiClient;

    public AiService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<ApiResult<AiAppointmentSuggestionResponse>> SuggestAppointmentAsync(AiAppointmentSuggestionRequest request, CancellationToken cancellationToken = default)
    {
        return await _apiClient.PostJsonAsync<AiAppointmentSuggestionResponse, AiAppointmentSuggestionRequest>("api/v1/ai/appointment-suggest", request, cancellationToken);
    }

    public async Task<ApiResult<LabSummaryResultDto>> SummarizeDocumentAsync(string patientId, string documentId, CancellationToken cancellationToken = default)
    {
        var request = new SummarizeDocumentRequest { DocumentId = documentId };
        return await _apiClient.PostJsonAsync<LabSummaryResultDto, SummarizeDocumentRequest>($"api/v1/ai/patient/{patientId}/summarize-doc", request, cancellationToken);
    }

    public async Task<ApiResult<CarePlanDraftResultDto>> DraftCarePlanAsync(string patientId, CancellationToken cancellationToken = default)
    {
        return await _apiClient.PostJsonAsync<CarePlanDraftResultDto, object>($"api/v1/ai/patient/{patientId}/draft-care-plan", new { }, cancellationToken);
    }

    public async Task<ApiResult<ScheduleOptimizationDto>> ScheduleOptimizationAsync(ScheduleOptimizationRequest request, CancellationToken cancellationToken = default)
    {
        return await _apiClient.PostJsonAsync<ScheduleOptimizationDto, ScheduleOptimizationRequest>("api/v1/ai/schedule-optimization", request, cancellationToken);
    }
}
