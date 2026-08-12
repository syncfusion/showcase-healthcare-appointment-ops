using System.Text;
using HealthcareAppointmentOps.Domain.Entities;

namespace HealthcareAppointmentOps.Application.Services;

/// <summary>
/// Canonical care-plan sample content shared by the data seeder (which persists it) and
/// <c>DocumentService.DraftCarePlanAsync</c> (which regenerates the editable draft on demand).
/// Keeping the goals/interventions/follow-ups in one place keeps the persisted structured fields
/// and the rendered SDO text in sync.
/// </summary>
public static class CarePlanContent
{
    public static readonly (string Goal, string Target, string Status, double ProgressPct)[] Goals =
    [
        ("Reduce hemoglobin A1c below 6.5%", "A1c < 6.5%", "In Progress", 55),
        ("Lower LDL cholesterol", "LDL < 100 mg/dL", "In Progress", 30),
        ("Achieve 150 minutes of weekly activity", "150 min/week", "Not Started", 0),
        ("Maintain blood pressure within target range", "BP < 130/85", "Achieved", 100)
    ];

    public static readonly string[] Interventions =
    [
        "Continue Metformin 500 mg twice daily",
        "Continue Lisinopril 10 mg once daily",
        "Start Atorvastatin 20 mg at bedtime",
        "Refer to registered dietitian for diabetes education",
        "Recommend home BP monitoring 3x/week"
    ];

    public static readonly string[] FollowUps =
    [
        "Follow-up appointment in 4 weeks",
        "Repeat metabolic panel in 8 weeks",
        "Annual eye exam referral",
        "Quarterly A1c monitoring"
    ];

    public const string Version = "v2.3";

    /// <summary>Renders the editable Syncfusion Document Editor text (plain-text fallback).</summary>
    public static string BuildSdo(Patient patient, string providerName, DateTime lastUpdated)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Care Plan — {patient.FirstName} {patient.LastName}");
        sb.AppendLine($"MRN: {patient.MedicalRecordNumber}    Primary Care Provider: {providerName}");
        sb.AppendLine($"Last Updated: {lastUpdated:yyyy-MM-dd}    Version: {Version}");
        sb.AppendLine();
        sb.AppendLine("Patient Summary");
        sb.AppendLine($"The patient is a {DateTime.UtcNow.Year - patient.DateOfBirth.Year}-year-old {patient.Gender.ToLower()} with a history of type 2 diabetes mellitus, hypertension, and hyperlipidemia. Management is currently medication-supported with lifestyle interventions in progress.");
        sb.AppendLine();
        sb.AppendLine("Active Conditions");
        sb.AppendLine("- Type 2 Diabetes Mellitus (E11.9)");
        sb.AppendLine("- Essential Hypertension (I10)");
        sb.AppendLine("- Hyperlipidemia, unspecified (E78.5)");
        sb.AppendLine();
        sb.AppendLine("Goals");
        for (var i = 0; i < Goals.Length; i++)
        {
            var g = Goals[i];
            var progress = g.Status == "Not Started" ? g.Status : $"{g.Status} ({g.ProgressPct:0}%)";
            sb.AppendLine($"{i + 1}. {g.Goal} ({g.Target}) — {progress}");
        }
        sb.AppendLine();
        sb.AppendLine("Interventions");
        foreach (var item in Interventions)
            sb.AppendLine($"- {item}");
        sb.AppendLine();
        sb.AppendLine("Follow-ups");
        foreach (var item in FollowUps)
            sb.AppendLine($"- {item}");
        return sb.ToString();
    }
}
