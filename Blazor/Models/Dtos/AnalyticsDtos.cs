using System.Text.Json.Serialization;

namespace HealthcareAppointmentOps.Blazor.Models.Dtos;

public class DashboardKpiDto
{
    [JsonPropertyName("period")]
    public string Period { get; set; } = string.Empty;

    [JsonPropertyName("totalAppointments")]
    public int TotalAppointments { get; set; }

    [JsonPropertyName("completedAppointments")]
    public int CompletedAppointments { get; set; }

    [JsonPropertyName("cancelledAppointments")]
    public int CancelledAppointments { get; set; }

    [JsonPropertyName("noShowAppointments")]
    public int NoShowAppointments { get; set; }

    [JsonPropertyName("noShowRate")]
    public double NoShowRate { get; set; }

    [JsonPropertyName("averageUtilization")]
    public double AverageUtilization { get; set; }

    [JsonPropertyName("averageWaitTimeMinutes")]
    public double AverageWaitTimeMinutes { get; set; }

    [JsonPropertyName("openWaitlistCount")]
    public int OpenWaitlistCount { get; set; }
}

public class UtilizationDataPointDto
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [JsonPropertyName("providerName")]
    public string ProviderName { get; set; } = string.Empty;

    [JsonPropertyName("utilizationRate")]
    public double UtilizationRate { get; set; }

    [JsonPropertyName("appointmentCount")]
    public int AppointmentCount { get; set; }

    [JsonPropertyName("totalSlots")]
    public int TotalSlots { get; set; }
}

public class NoShowTrendDto
{
    [JsonPropertyName("period")]
    public string Period { get; set; } = string.Empty;

    [JsonPropertyName("departmentId")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("departmentName")]
    public string DepartmentName { get; set; } = string.Empty;

    [JsonPropertyName("noShowRate")]
    public double NoShowRate { get; set; }

    [JsonPropertyName("totalAppointments")]
    public int TotalAppointments { get; set; }
}

public class VolumeDataPointDto
{
    [JsonPropertyName("period")]
    public string Period { get; set; } = string.Empty;

    [JsonPropertyName("departmentId")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("departmentName")]
    public string DepartmentName { get; set; } = string.Empty;

    [JsonPropertyName("appointmentType")]
    public string AppointmentType { get; set; } = string.Empty;

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public class CancellationReasonDto
{
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("count")]
    public int Count { get; set; }
}
