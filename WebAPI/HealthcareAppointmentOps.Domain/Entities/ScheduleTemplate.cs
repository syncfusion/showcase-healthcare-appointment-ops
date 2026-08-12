namespace HealthcareAppointmentOps.Domain.Entities;

public class ScheduleTemplate
{
    public Guid TemplateId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid DepartmentId { get; set; }
    public Guid LocationId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int SlotDuration { get; set; }
    public bool IsActive { get; set; } = true;
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }

    public Provider Provider { get; set; } = null!;
    public Department Department { get; set; } = null!;
    public Location Location { get; set; } = null!;
}
