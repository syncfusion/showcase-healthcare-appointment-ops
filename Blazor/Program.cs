using HealthcareAppointmentOps.Blazor.Components;
using HealthcareAppointmentOps.Blazor.Services;
using Syncfusion.Blazor;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddHubOptions(options => options.MaximumReceiveMessageSize = 64 * 1024 * 1024)
    .AddCircuitOptions(options => options.DetailedErrors = builder.Environment.IsDevelopment());

builder.Services.AddSyncfusionBlazor();
builder.Services.AddMemoryCache();

var apiBaseUrl = builder.Configuration.GetValue<string>("ApiBaseUrl") ?? "http://localhost:5186";
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(apiBaseUrl),
    DefaultRequestHeaders = { { "Accept", "application/json" } }
});

builder.Services.AddScoped<ApiClient>();
builder.Services.AddScoped<ThemeService>();
builder.Services.AddScoped<PatientService>();
builder.Services.AddScoped<AppointmentService>();
builder.Services.AddScoped<ProviderService>();
builder.Services.AddScoped<WaitlistService>();
builder.Services.AddScoped<AnalyticsService>();
builder.Services.AddScoped<AiService>();
builder.Services.AddScoped<ReferenceDataService>();
builder.Services.AddScoped<AuditLogService>();

var app = builder.Build();

var syncfusionLicenseKey =
    Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY")
    ?? builder.Configuration["Syncfusion:LicenseKey"];

if (!string.IsNullOrWhiteSpace(syncfusionLicenseKey))
{
    Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(syncfusionLicenseKey);
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();

app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
