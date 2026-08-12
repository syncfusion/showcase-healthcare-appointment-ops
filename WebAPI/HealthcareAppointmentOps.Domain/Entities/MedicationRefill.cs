namespace HealthcareAppointmentOps.Domain.Entities;

public class MedicationRefill
{
    public Guid MedicationRefillId { get; set; }
    public Guid MedicationId { get; set; }
    public Guid PatientId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public DateTime RefillDate { get; set; }
    public string Status { get; set; } = string.Empty;

    public Medication Medication { get; set; } = null!;
}
