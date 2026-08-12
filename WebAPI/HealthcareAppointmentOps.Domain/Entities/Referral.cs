namespace HealthcareAppointmentOps.Domain.Entities;

public class Referral
{
    public Guid ReferralId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime RequestedDate { get; set; }
    public string Specialty { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string FromProvider { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    public Patient Patient { get; set; } = null!;
}
