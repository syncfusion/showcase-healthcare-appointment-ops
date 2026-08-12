namespace HealthcareAppointmentOps.Application.DTOs;

public class ProviderSummaryDto
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
    public string DepartmentName { get; set; } = string.Empty;
    public Guid LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int AverageAppointmentDuration { get; set; }
}

public class ProviderDetailDto : ProviderSummaryDto
{
    public List<ScheduleTemplateDto> Templates { get; set; } = [];
}

public class ScheduleTemplateDto
{
    public Guid TemplateId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid DepartmentId { get; set; }
    public Guid LocationId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int SlotDuration { get; set; }
    public bool IsActive { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
}

public class SlotDto
{
    public DateTime SlotStart { get; set; }
    public DateTime SlotEnd { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public Guid LocationId { get; set; }
}

public class CreateScheduleTemplateRequest
{
    public Guid DepartmentId { get; set; }
    public Guid LocationId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int SlotDuration { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
}
