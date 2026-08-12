namespace HealthcareAppointmentOps.Blazor.Components.Shared;

public static class AppointmentColors
{
    public const string Fallback = "var(--color-sf-appt-fallback)";

    public static readonly IReadOnlyDictionary<string, string> Palette = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["Consultation"] = "var(--color-sf-appt-consultation)",
        ["Annual Physical"] = "var(--color-sf-appt-annual-physical)",
        ["Lab Review"] = "var(--color-sf-appt-lab-review)",
        ["Telehealth"] = "var(--color-sf-appt-telehealth)",
        ["Procedure"] = "var(--color-sf-appt-procedure)",
        ["Follow-Up"] = "var(--color-sf-appt-follow-up)",
        ["Urgent Care"] = "var(--color-sf-appt-urgent-care)",
        ["Vaccination"] = "var(--color-sf-appt-vaccination)",
        ["Imaging"] = "var(--color-sf-appt-imaging)",
        ["Administrative"] = "var(--color-sf-appt-administrative)",
        ["New Patient"] = "var(--color-sf-appt-new-patient)",
    };

    public static string GetColor(string? type) =>
        !string.IsNullOrWhiteSpace(type) && Palette.TryGetValue(type, out var value) ? value : Fallback;

    public static string ChooseTextColor(string backgroundColor)
    {
        var hex = backgroundColor.Replace("#", string.Empty);
        if (hex.Length != 6) return "white";
        if (!int.TryParse(hex.AsSpan(0, 2), System.Globalization.NumberStyles.HexNumber, null, out var r0)) return "white";
        if (!int.TryParse(hex.AsSpan(2, 2), System.Globalization.NumberStyles.HexNumber, null, out var g0)) return "white";
        if (!int.TryParse(hex.AsSpan(4, 2), System.Globalization.NumberStyles.HexNumber, null, out var b0)) return "white";

        var r = r0 / 255.0;
        var g = g0 / 255.0;
        var b = b0 / 255.0;

        double Linearize(double channel) =>
            channel <= 0.03928 ? channel / 12.92 : Math.Pow((channel + 0.055) / 1.055, 2.4);

        var luminance = 0.2126 * Linearize(r) + 0.7152 * Linearize(g) + 0.0722 * Linearize(b);
        return luminance > 0.179 ? "black" : "white";
    }
}
