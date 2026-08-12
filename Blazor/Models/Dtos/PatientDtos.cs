using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models.Dtos;

public class PatientSummaryDto
{
    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("medicalRecordNumber")]
    public string MedicalRecordNumber { get; set; } = string.Empty;

    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("dateOfBirth")]
    public string DateOfBirth { get; set; } = string.Empty;

    [JsonPropertyName("gender")]
    public string Gender { get; set; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("primaryCareProviderName")]
    public string PrimaryCareProviderName { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("nextAppointmentDateTime")]
    public string? NextAppointmentDateTime { get; set; }

    [JsonPropertyName("nextAppointmentType")]
    public string? NextAppointmentType { get; set; }

    [JsonPropertyName("nextAppointmentStatus")]
    public string? NextAppointmentStatus { get; set; }
}

public class CommunicationPreferencesDto
{
    [JsonPropertyName("sms")]
    public bool Sms { get; set; }

    [JsonPropertyName("email")]
    public bool Email { get; set; }

    [JsonPropertyName("phone")]
    public bool Phone { get; set; }

    [JsonPropertyName("portal")]
    public bool Portal { get; set; }
}

public class PatientSearchItem
{
    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("medicalRecordNumber")]
    public string MedicalRecordNumber { get; set; } = string.Empty;

    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("dateOfBirth")]
    public string DateOfBirth { get; set; } = string.Empty;

    [JsonPropertyName("gender")]
    public string Gender { get; set; } = string.Empty;

    [JsonPropertyName("display")]
    public string? Display { get; set; }
}

public class PatientDetailDto
{
    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("medicalRecordNumber")]
    public string MedicalRecordNumber { get; set; } = string.Empty;

    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("dateOfBirth")]
    public string DateOfBirth { get; set; } = string.Empty;

    [JsonPropertyName("gender")]
    public string Gender { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("addressLine")]
    public string AddressLine { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("postalCode")]
    public string PostalCode { get; set; } = string.Empty;

    [JsonPropertyName("preferredLanguage")]
    public string PreferredLanguage { get; set; } = string.Empty;

    [JsonPropertyName("primaryCareProviderId")]
    public string? PrimaryCareProviderId { get; set; }

    [JsonPropertyName("primaryCareProviderName")]
    public string PrimaryCareProviderName { get; set; } = string.Empty;

    [JsonPropertyName("insuranceType")]
    public string InsuranceType { get; set; } = string.Empty;

    [JsonPropertyName("registrationDate")]
    public string RegistrationDate { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("communicationPreferences")]
    public CommunicationPreferencesDto CommunicationPreferences { get; set; } = new();

    [JsonPropertyName("hasProxyAccess")]
    public bool HasProxyAccess { get; set; }
}
