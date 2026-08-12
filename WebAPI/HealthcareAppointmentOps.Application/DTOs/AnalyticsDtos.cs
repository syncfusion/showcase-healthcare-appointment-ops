namespace HealthcareAppointmentOps.Application.DTOs;

public class DashboardKpiDto
{
    public string Period { get; set; } = string.Empty;
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public int NoShowAppointments { get; set; }
    public double NoShowRate { get; set; }
    public double AverageUtilization { get; set; }
    public double AverageWaitTimeMinutes { get; set; }
    public int OpenWaitlistCount { get; set; }
}

public class UtilizationDataPointDto
{
    public DateOnly Date { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public double UtilizationRate { get; set; }
    public int AppointmentCount { get; set; }
    public int TotalSlots { get; set; }
}

public class NoShowTrendDto
{
    public string Period { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public double NoShowRate { get; set; }
    public int TotalAppointments { get; set; }
}

public class VolumeDataPointDto
{
    public string Period { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string AppointmentType { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class CancellationReasonDto
{
    public string Reason { get; set; } = string.Empty;
    public int Count { get; set; }
}
