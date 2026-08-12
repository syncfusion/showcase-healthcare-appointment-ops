namespace HealthcareAppointmentOps.Blazor.Components.Shared;

public static class DateRangeUtils
{
    public static DateTime StartOfWeek(DateTime value, DayOfWeek startOfWeek = DayOfWeek.Sunday)
    {
        var diff = ((7 + (value.DayOfWeek - startOfWeek)) % 7);
        return value.Date.AddDays(-diff);
    }

    public static DateTime EndOfWeek(DateTime value, DayOfWeek startOfWeek = DayOfWeek.Sunday)
    {
        return StartOfWeek(value, startOfWeek).AddDays(7).AddTicks(-1);
    }

    public static string ToIsoString(DateTime value) => value.ToUniversalTime().ToString("O");

    public static string ToEndOfDayIso(DateTime value) =>
        value.Date.AddDays(1).AddTicks(-1).ToUniversalTime().ToString("O");

    public static DateTime? TryParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (DateTime.TryParse(value, null, System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out var dt))
            return dt.ToLocalTime();
        return null;
    }
}
