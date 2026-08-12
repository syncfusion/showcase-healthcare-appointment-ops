namespace HealthcareAppointmentOps.Domain.Entities;

public class LabResult
{
    public Guid LabResultId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime CollectedDate { get; set; }
    public string TestName { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string ReferenceRange { get; set; } = string.Empty;
    public bool IsAbnormal { get; set; }
    public string Category { get; set; } = string.Empty;

    public Patient Patient { get; set; } = null!;
}
