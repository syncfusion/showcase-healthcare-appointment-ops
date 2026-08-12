namespace HealthcareAppointmentOps.Domain.Entities;

public class Patient
{
    public Guid PatientId { get; set; }
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string PreferredLanguage { get; set; } = "English";
    public Guid? PrimaryCareProviderId { get; set; }
    public string InsuranceType { get; set; } = string.Empty;
    public DateOnly RegistrationDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string CommunicationPreferences { get; set; } = "{}";
    public bool HasProxyAccess { get; set; }

    public Provider? PrimaryCareProvider { get; set; }
    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<WaitlistEntry> WaitlistEntries { get; set; } = [];
}
