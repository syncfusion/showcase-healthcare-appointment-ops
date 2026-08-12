using HealthcareAppointmentOps.Blazor.Models.Dtos;

namespace HealthcareAppointmentOps.Blazor.Components.Shared;

public class ScheduleEventData
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string ProviderId { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; }
    public bool IsReadonly { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = AppointmentColors.Fallback;
    public string PatientMrn { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }

    public static ScheduleEventData FromDto(AppointmentSummaryDto dto, string providerFallbackId) => new()
    {
        Id = dto.AppointmentId,
        Subject = string.IsNullOrEmpty(dto.PatientName) ? dto.AppointmentType : $"{dto.PatientName} — {dto.AppointmentType}",
        StartTime = ParseDate(dto.ScheduledDateTime),
        EndTime = ParseDate(dto.ScheduledDateTime).AddMinutes(dto.DurationMinutes),
        ProviderId = string.IsNullOrEmpty(dto.ProviderId) ? providerFallbackId : dto.ProviderId,
        ResourceId = string.IsNullOrEmpty(dto.ProviderId) ? providerFallbackId : dto.ProviderId,
        ProviderName = dto.ProviderName,
        PatientName = dto.PatientName,
        Status = dto.Status,
        IsReadonly = dto.Status is AppointmentStatus.Completed or AppointmentStatus.Cancelled or AppointmentStatus.NoShow,
        AppointmentType = dto.AppointmentType,
        CategoryColor = AppointmentColors.GetColor(dto.AppointmentType),
        PatientMrn = dto.PatientMrn,
        DurationMinutes = dto.DurationMinutes,
    };

    private static DateTime ParseDate(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return DateTime.UtcNow;
        return DateTime.TryParse(value, null, System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out var dt)
            ? dt.ToLocalTime()
            : DateTime.UtcNow;
    }
}
