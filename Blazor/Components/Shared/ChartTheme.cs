using HealthcareAppointmentOps.Blazor.Services;
using Syncfusion.Blazor;

namespace HealthcareAppointmentOps.Blazor.Components.Shared;

/// <summary>
/// Resolves the Syncfusion chart theme from the app's resolved theme
/// </summary>
public static class ChartTheme
{
    public static Syncfusion.Blazor.Theme Resolve(ResolvedTheme resolved) =>
        resolved == ResolvedTheme.Dark
            ? Syncfusion.Blazor.Theme.Tailwind3Dark
            : Syncfusion.Blazor.Theme.Tailwind3;

    public static string KeyFor(ResolvedTheme resolved) =>
        resolved == ResolvedTheme.Dark ? "dark" : "light";
}