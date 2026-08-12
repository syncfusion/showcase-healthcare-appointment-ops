using Microsoft.JSInterop;

namespace HealthcareAppointmentOps.Blazor.Services;

public enum ThemeMode
{
    Light,
    Dark,
    System
}

public enum ResolvedTheme
{
    Light,
    Dark
}

public class ThemeService
{
    private readonly IJSRuntime _jsRuntime;
    private ThemeMode _mode = ThemeMode.Light;
    private ResolvedTheme _resolved = ResolvedTheme.Light;
    private bool _initialized;

    public ThemeService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
    }

    public ThemeMode Mode => _mode;
    public ResolvedTheme Resolved => _resolved;

    public event Action? OnChange;

    public async Task InitializeAsync()
    {
        if (_initialized) return;

        var stored = await _jsRuntime.InvokeAsync<string>("healthOpsTheme.readStoredMode");
        _mode = ParseMode(stored);
        await ApplyAsync(_mode);
        _initialized = true;
        OnChange?.Invoke();
    }

    public async Task SetModeAsync(ThemeMode mode)
    {
        _mode = mode;
        await ApplyAsync(mode);
        OnChange?.Invoke();
    }

    private async Task ApplyAsync(ThemeMode mode)
    {
        await _jsRuntime.InvokeVoidAsync("healthOpsTheme.setMode", mode.ToString().ToLowerInvariant());
        if (mode == ThemeMode.Light)
            _resolved = ResolvedTheme.Light;
        else if (mode == ThemeMode.Dark)
            _resolved = ResolvedTheme.Dark;
        else
            _resolved = await _jsRuntime.InvokeAsync<bool>("healthOpsTheme.isSystemDark") ? ResolvedTheme.Dark : ResolvedTheme.Light;
    }

    private static ThemeMode ParseMode(string? value) => value?.ToLowerInvariant() switch
    {
        "dark" => ThemeMode.Dark,
        "system" => ThemeMode.System,
        _ => ThemeMode.Light
    };
}
