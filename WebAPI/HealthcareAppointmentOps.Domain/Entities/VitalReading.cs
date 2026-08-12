namespace HealthcareAppointmentOps.Domain.Entities;

public class VitalReading
{
    public Guid VitalReadingId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime ReadingDate { get; set; }
    public string Metric { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? ReferenceRange { get; set; }
    public bool IsAbnormal { get; set; }

    public Patient Patient { get; set; } = null!;
}
