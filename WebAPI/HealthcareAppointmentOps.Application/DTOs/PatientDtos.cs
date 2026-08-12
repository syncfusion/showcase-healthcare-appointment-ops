namespace HealthcareAppointmentOps.Application.DTOs;

public class PatientSummaryDto
{
    public Guid PatientId { get; set; }
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PrimaryCareProviderName { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    /// <summary>
    /// Next upcoming (future, non-terminal) appointment for the patient.
    /// Null when no upcoming appointment exists.
    /// </summary>
    public DateTime? NextAppointmentDateTime { get; set; }
    public string? NextAppointmentType { get; set; }
    public string? NextAppointmentStatus { get; set; }
}

public class PatientDetailDto
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
    public string PreferredLanguage { get; set; } = string.Empty;
    public Guid? PrimaryCareProviderId { get; set; }
    public string PrimaryCareProviderName { get; set; } = string.Empty;
    public string InsuranceType { get; set; } = string.Empty;
    public DateOnly RegistrationDate { get; set; }
    public bool IsActive { get; set; }
    public CommunicationPreferencesDto CommunicationPreferences { get; set; } = new();
    public bool HasProxyAccess { get; set; }
}

public class CommunicationPreferencesDto
{
    public bool Sms { get; set; }
    public bool Email { get; set; }
    public bool Phone { get; set; }
    public bool Portal { get; set; }
}
