namespace HealthcareAppointmentOps.Domain.Entities;

public class Medication
{
    public Guid MedicationId { get; set; }
    public Guid PatientId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string PrescriberName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? StopReason { get; set; }
    public int RefillsRemaining { get; set; }
    public string Pharmacy { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    public Patient Patient { get; set; } = null!;
    public ICollection<MedicationRefill> Refills { get; set; } = [];
}
