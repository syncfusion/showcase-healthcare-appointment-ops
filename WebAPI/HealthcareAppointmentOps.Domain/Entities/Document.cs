namespace HealthcareAppointmentOps.Domain.Entities;

public class Document
{
    public Guid DocumentId { get; set; }
    public Guid PatientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime UploadedDate { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int PageCount { get; set; }

    public Patient Patient { get; set; } = null!;
}
