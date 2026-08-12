using System.Globalization;

namespace HealthcareAppointmentOps.Blazor.Components.Shared;

/// <summary>
/// Shared US (en-US) date formatters. All output uses US-numeric format with
/// leading zeros on month/day, matching the React app's fmtDate/fmtTime/fmtDateTime.
///
///   FormatDate     -> "08/03/2026"
///   FormatDateTime -> "08/03/2026, 2:30 PM"
///   FormatTime     -> "02:30 PM"
/// </summary>
public static class DateFormats
{
    /// <summary>Date only from an ISO string, e.g. "08/03/2026".</summary>
    public static string FormatDate(string? iso)
    {
        if (string.IsNullOrWhiteSpace(iso)) return "—";
        if (DateTime.TryParse(iso, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return dt.ToString("MM/dd/yyyy", CultureInfo.InvariantCulture);
        return "—";
    }

    /// <summary>Date only from a DateTime, e.g. "08/03/2026".</summary>
    public static string FormatDate(DateTime? dt)
    {
        if (dt is null) return "—";
        return dt.Value.ToString("MM/dd/yyyy", CultureInfo.InvariantCulture);
    }

    /// <summary>Date + time from an ISO string, e.g. "08/03/2026, 2:30 PM".</summary>
    public static string FormatDateTime(string? iso)
    {
        if (string.IsNullOrWhiteSpace(iso)) return "—";
        if (DateTime.TryParse(iso, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return FormatDateTime(dt);
        return "—";
    }

    /// <summary>Date + time from a DateTime, e.g. "08/03/2026, 2:30 PM".</summary>
    public static string FormatDateTime(DateTime? dt)
    {
        if (dt is null) return "—";
        return dt.Value.ToString("MM/dd/yyyy, h:mm tt", CultureInfo.InvariantCulture);
    }

    /// <summary>Time only from an ISO string, e.g. "02:30 PM".</summary>
    public static string FormatTime(string? iso)
    {
        if (string.IsNullOrWhiteSpace(iso)) return "—";
        if (DateTime.TryParse(iso, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return FormatTime(dt);
        return "—";
    }

    /// <summary>Time only from a DateTime, e.g. "02:30 PM".</summary>
    public static string FormatTime(DateTime? dt)
    {
        if (dt is null) return "—";
        return dt.Value.ToString("h:mm tt", CultureInfo.InvariantCulture);
    }
}