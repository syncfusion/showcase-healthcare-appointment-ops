namespace HealthcareAppointmentOps.Blazor.Components.Shared;

/// <summary>
/// Centralised chart colour palette.
/// </summary>
public static class ChartPalette
{
    public const string SeriesTeal   = "#0D9488";
    public const string SeriesIndigo = "#6366F1";
    public const string SeriesAmber  = "#F59E0B";
    public const string SeriesRose   = "#F43F5E";

    public static readonly string[] BarRamp =
        { "#0D9488", "#6366F1", "#0EA5E9", "#8B5CF6", "#14B8A6", "#F59E0B", "#F43F5E" };

    public static readonly string[] CategoryRamp =
        { "#0D9488", "#6366F1", "#0EA5E9", "#8B5CF6", "#F59E0B", "#F43F5E", "#14B8A6" };

    public sealed record AppointmentTypeSeriesItem(string Label, string PropertyName, string Color);

    public static readonly AppointmentTypeSeriesItem[] AppointmentTypeSeries =
    {
        new("New Patient",     "NewPatient",     "#0D9488"),
        new("Follow-Up",       "FollowUp",       "#6366F1"),
        new("Annual Physical", "AnnualPhysical", "#D97706"),
        new("Urgent Care",     "UrgentCare",     "#F43F5E"),
        new("Consultation",    "Consultation",   "#0284C7"),
        new("Procedure",       "Procedure",      "#8B5CF6"),
        new("Lab Review",      "LabReview",      "#16A34A"),
        new("Telehealth",      "Telehealth",     "#EA580C"),
    };

    /// <summary>
    /// a clamped viewport-relative
    /// CSS height so charts fill available vertical space without overflowing.
    /// </summary>
    /// <param name="rows">Number of stacked charts the viewport shares (1-based).</param>
    /// <param name="reserve">Pixels to reserve for non-chart UI (filters, paddings, headers).</param>
    /// <param name="floor">Minimum height in pixels.</param>
    /// <param name="cap">Maximum height in pixels.</param>
    /// <returns>CSS clamp() expression.</returns>
    public static string ChartFillHeight(int rows = 1, int reserve = 320, int floor = 260, int cap = 720) =>
        $"clamp({floor}px, calc((100vh - {reserve}px) / {rows}), {cap}px)";
}