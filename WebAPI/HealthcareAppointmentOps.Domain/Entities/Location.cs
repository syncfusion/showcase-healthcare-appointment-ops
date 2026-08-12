namespace HealthcareAppointmentOps.Domain.Entities;

public class Location
{
    public Guid LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string TimeZone { get; set; } = "America/New_York";
    public bool IsActive { get; set; } = true;

    public ICollection<Department> Departments { get; set; } = [];
    public ICollection<Provider> Providers { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
}
