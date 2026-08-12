namespace HealthcareAppointmentOps.Domain.Entities;

public class Provider
{
    public Guid ProviderId { get; set; }
    public string NpiNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public Guid LocationId { get; set; }
    public bool IsActive { get; set; } = true;
    public int AverageAppointmentDuration { get; set; }

    public Department Department { get; set; } = null!;
    public Location Location { get; set; } = null!;
    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<ScheduleTemplate> ScheduleTemplates { get; set; } = [];
    public ICollection<Patient> PrimaryCarePatients { get; set; } = [];
}
