namespace HealthcareAppointmentOps.Domain.Entities;

public class Encounter
{
    public Guid EncounterId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime EncounterDate { get; set; }
    public string EncounterType { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Assessment { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    public Patient Patient { get; set; } = null!;
}
