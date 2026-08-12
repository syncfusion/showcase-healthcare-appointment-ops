namespace HealthcareAppointmentOps.Domain.Entities;

public class Department
{
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public Guid LocationId { get; set; }
    public bool IsActive { get; set; } = true;

    public Location Location { get; set; } = null!;
    public ICollection<Provider> Providers { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
}
