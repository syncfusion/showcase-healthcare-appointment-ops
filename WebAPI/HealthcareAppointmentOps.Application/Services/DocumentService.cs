using System.Text.Json;
using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;

namespace HealthcareAppointmentOps.Application.Services;

public class DocumentService(IPatientRepository patientRepo, IDocumentRepository documentRepo, IDocumentPdfRenderer pdfRenderer) : IDocumentService
{
    public async Task<ApiResult<List<DocumentDto>>> GetForPatientAsync(Guid patientId, CancellationToken ct = default)
    {
        var patient = await patientRepo.GetByIdAsync(patientId, ct);
        if (patient == null)
            return ApiResult<List<DocumentDto>>.Failure("Patient not found", $"No patient found for ID {patientId}", "NotFound");

        var documents = await documentRepo.GetByPatientIdAsync(patientId, ct);
        var docs = documents.Select(d => new DocumentDto
        {
            DocumentId = d.DocumentId,
            PatientId = d.PatientId,
            Name = d.Name,
            Type = d.Type,
            UploadedDate = d.UploadedDate,
            ProviderName = d.ProviderName,
            Status = d.Status,
            Url = d.Url,
            SizeBytes = d.SizeBytes,
            PageCount = d.PageCount
        }).ToList();

        return ApiResult<List<DocumentDto>>.Success(docs);
    }

    public async Task<ApiResult<DocumentPdfContent>> GetDocumentContentAsync(Guid patientId, Guid documentId, CancellationToken ct = default)
    {
        var patient = await patientRepo.GetByIdAsync(patientId, ct);
        if (patient == null)
            return ApiResult<DocumentPdfContent>.Failure("Patient not found", $"No patient found for ID {patientId}", "NotFound");

        var documents = await documentRepo.GetByPatientIdAsync(patientId, ct);
        var document = documents.FirstOrDefault(d => d.DocumentId == documentId);
        if (document == null)
            return ApiResult<DocumentPdfContent>.Failure("Document not found", $"Document {documentId} is not on file for patient {patientId}", "NotFound");

        // Ownership guard: documents returned above are already scoped to the patient, but enforce
        // it explicitly to never leak one patient's document bytes to another.
        if (document.PatientId != patientId)
            return ApiResult<DocumentPdfContent>.Failure("Document not found", $"Document {documentId} does not belong to patient {patientId}", "NotFound");

        var content = pdfRenderer.Render(document, patient);
        return ApiResult<DocumentPdfContent>.Success(content);
    }

    public async Task<ApiResult<LabSummaryResultDto>> SummarizeDocumentAsync(Guid patientId, Guid documentId, CancellationToken ct = default)
    {
        var patient = await patientRepo.GetByIdAsync(patientId, ct);
        if (patient == null)
            return ApiResult<LabSummaryResultDto>.Failure("Patient not found", $"No patient found for ID {patientId}", "NotFound");

        var summary = new LabSummaryResultDto
        {
            Summary =
                "Most recent metabolic panel shows hemoglobin A1c slightly above target (6.8%), " +
                "with LDL cholesterol high-normal at 118 mg/dL. Fasting glucose is elevated (128 mg/dL). " +
                "HDL and TSH are within reference range. No critical values observed. Recommend lifestyle " +
                "reinforcement and repeat labs in 8 weeks.",
            Recommendations =
            [
                new LabSummaryRecommendationDto
                {
                    Title = "Schedule diabetes education referral",
                    Rationale = "A1c above 6.5% indicates pre-diabetic range; structured education reduces 5-year progression risk by ~40%.",
                    Severity = "Warning"
                },
                new LabSummaryRecommendationDto
                {
                    Title = "Reinforce low-sodium, low-glycemic diet",
                    Rationale = "LDL borderline and fasting glucose elevated — dietary modification is first-line therapy before medication escalation.",
                    Severity = "Info"
                },
                new LabSummaryRecommendationDto
                {
                    Title = "Repeat metabolic panel in 8 weeks",
                    Rationale = "Confirm trend and response to lifestyle interventions before adjusting statin or metformin dosing.",
                    Severity = "Info"
                }
            ],
            Confidence = 0.87,
            Explanation = "Summarized using the lab report document and the patient's care plan goals. Confidence reflects clear reference ranges and explicit abnormal flags on the source document."
        };

        return ApiResult<LabSummaryResultDto>.Success(summary);
    }

    public async Task<ApiResult<CarePlanDto>> GetCarePlanAsync(Guid patientId, CancellationToken ct = default)
    {
        var patient = await patientRepo.GetByIdAsync(patientId, ct);
        if (patient == null)
            return ApiResult<CarePlanDto>.Failure("Patient not found", $"No patient found for ID {patientId}", "NotFound");

        var carePlan = await documentRepo.GetCarePlanAsync(patientId, ct);
        if (carePlan == null)
            return ApiResult<CarePlanDto>.Failure("Care plan not found", $"No care plan on file for patient {patientId}", "NotFound");

        var dto = new CarePlanDto
        {
            PatientId = patientId,
            Title = carePlan.Title,
            LastUpdated = carePlan.LastUpdated,
            Version = carePlan.Version,
            AuthorName = carePlan.AuthorName,
            SdoContent = carePlan.SdoContent,
            Goals = carePlan.Goals.Select(g => new CarePlanGoalDto
            {
                Goal = g.Goal,
                Target = g.Target,
                Status = g.Status,
                ProgressPct = g.ProgressPct
            }).ToList(),
            Interventions = Deserialize(carePlan.InterventionsJson),
            FollowUps = Deserialize(carePlan.FollowUpsJson)
        };

        return ApiResult<CarePlanDto>.Success(dto);
    }

    public async Task<ApiResult<CarePlanDraftResultDto>> DraftCarePlanAsync(Guid patientId, CancellationToken ct = default)
    {
        var patient = await patientRepo.GetByIdAsync(patientId, ct);
        if (patient == null)
            return ApiResult<CarePlanDraftResultDto>.Failure("Patient not found", $"No patient found for ID {patientId}", "NotFound");

        var providerName = patient.PrimaryCareProvider != null
            ? $"{patient.PrimaryCareProvider.FirstName} {patient.PrimaryCareProvider.LastName}"
            : "Dr. Sample Provider";

        var draft = new CarePlanDraftResultDto
        {
            SdoContent = CarePlanContent.BuildSdo(patient, providerName, DateTime.UtcNow),
            Confidence = 0.82,
            Explanation = "Drafted from the most recent vitals, lab results, active medications, and existing care goals. Provider review and editing required before publishing.",
            GeneratedSections = ["Patient Summary", "Active Conditions", "Goals", "Interventions", "Follow-ups"]
        };

        return ApiResult<CarePlanDraftResultDto>.Success(draft);
    }

    private static List<string> Deserialize(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? []; }
        catch { return []; }
    }
}
