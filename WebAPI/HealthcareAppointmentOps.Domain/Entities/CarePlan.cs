namespace HealthcareAppointmentOps.Domain.Entities;

public class CarePlan
{
    public Guid CarePlanId { get; set; }
    public Guid PatientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
    public string Version { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string SdoContent { get; set; } = string.Empty;
    // Interventions/FollowUps are stored as JSON string arrays (same convention as
    // Patient.CommunicationPreferences); the service (de)serializes to List<string>.
    public string InterventionsJson { get; set; } = "[]";
    public string FollowUpsJson { get; set; } = "[]";

    public Patient Patient { get; set; } = null!;
    public ICollection<CarePlanGoal> Goals { get; set; } = [];
}
