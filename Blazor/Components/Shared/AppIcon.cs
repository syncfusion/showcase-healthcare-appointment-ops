using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;

namespace HealthcareAppointmentOps.Blazor.Components.Shared;

public static class AppIcon
{
    public static RenderFragment FromFile(string fileName, int size = 20, string? ariaLabel = null, string? cssClass = null) => b =>
    {
        b.OpenElement(0, "span");
        b.AddAttribute(1, "role", "img");
        b.AddAttribute(2, "aria-label", ariaLabel ?? string.Empty);
        b.AddAttribute(3, "aria-hidden", string.IsNullOrEmpty(ariaLabel) ? "true" : "false");
        var mask = $"url(/icons/{fileName}) center / contain no-repeat";
        b.AddAttribute(4, "style",
            $"display:inline-block; width:{size}px; height:{size}px; flex-shrink:0; " +
            $"background-color:currentColor; vertical-align:middle; " +
            $"-webkit-mask:{mask}; mask:{mask};");
        if (!string.IsNullOrEmpty(cssClass)) b.AddAttribute(5, "class", cssClass);
        b.CloseElement();
    };

    public static RenderFragment LayoutDashboard(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("layout-dashboard.svg", size, ariaLabel, cssClass);
    public static RenderFragment CalendarDays(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("calendar-days.svg", size, ariaLabel, cssClass);
    public static RenderFragment Users(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("users.svg", size, ariaLabel, cssClass);
    public static RenderFragment Clock(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("clock.svg", size, ariaLabel, cssClass);
    public static RenderFragment Stethoscope(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("stethoscope.svg", size, ariaLabel, cssClass);
    public static RenderFragment BarChart3(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("bar-chart-3.svg", size, ariaLabel, cssClass);
    public static RenderFragment CheckCircle(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("check-circle.svg", size, ariaLabel, cssClass);
    public static RenderFragment Settings(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("settings.svg", size, ariaLabel, cssClass);
    public static RenderFragment ChevronLeft(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("chevron-left.svg", size, ariaLabel, cssClass);
    public static RenderFragment ChevronRight(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("chevron-right.svg", size, ariaLabel, cssClass);
    public static RenderFragment Menu(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("menu.svg", size, ariaLabel, cssClass);
    public static RenderFragment HeartPulse(int size = 24, string? ariaLabel = null, string? cssClass = null) => FromFile("heart-pulse.svg", size, ariaLabel, cssClass);
    public static RenderFragment UserCheck(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("user-check.svg", size, ariaLabel, cssClass);
    public static RenderFragment TrendingUp(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("trending-up.svg", size, ariaLabel, cssClass);
    public static RenderFragment ListChecks(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("list-checks.svg", size, ariaLabel, cssClass);
    public static RenderFragment AlertCircle(int size = 16, string? ariaLabel = null, string? cssClass = null) => FromFile("alert-circle.svg", size, ariaLabel, cssClass);
    public static RenderFragment Activity(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("activity.svg", size, ariaLabel, cssClass);
    public static RenderFragment UserX(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("user-x.svg", size, ariaLabel, cssClass);
    public static RenderFragment MapPin(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("map-pin.svg", size, ariaLabel, cssClass);
    public static RenderFragment XCircle(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("x-circle.svg", size, ariaLabel, cssClass);
    public static RenderFragment Search(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("search.svg", size, ariaLabel, cssClass);
    public static RenderFragment Plus(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("plus.svg", size, ariaLabel, cssClass);
    public static RenderFragment FileText(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("file-text.svg", size, ariaLabel, cssClass);
    public static RenderFragment Save(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("save.svg", size, ariaLabel, cssClass);
    public static RenderFragment Trash2(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("trash-2.svg", size, ariaLabel, cssClass);
    public static RenderFragment RefreshCw(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("refresh-cw.svg", size, ariaLabel, cssClass);
    public static RenderFragment Filter(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("filter.svg", size, ariaLabel, cssClass);
    public static RenderFragment Edit3(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("edit-3.svg", size, ariaLabel, cssClass);
    public static RenderFragment Eye(int size = 20, string? ariaLabel = null, string? cssClass = null) => FromFile("eye.svg", size, ariaLabel, cssClass);
    public static RenderFragment Sun(int size = 18, string? ariaLabel = null, string? cssClass = null) => FromFile("sun.svg", size, ariaLabel, cssClass);
    public static RenderFragment Moon(int size = 18, string? ariaLabel = null, string? cssClass = null) => FromFile("moon.svg", size, ariaLabel, cssClass);
    public static RenderFragment Monitor(int size = 18, string? ariaLabel = null, string? cssClass = null) => FromFile("monitor.svg", size, ariaLabel, cssClass);
}
