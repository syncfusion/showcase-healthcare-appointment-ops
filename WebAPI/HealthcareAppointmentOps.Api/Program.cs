using HealthcareAppointmentOps.Api;
using HealthcareAppointmentOps.Api.Demo;
using HealthcareAppointmentOps.Application;
using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Infrastructure;
using HealthcareAppointmentOps.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

var syncfusionLicenseKey =
    Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY")
    ?? builder.Configuration["Syncfusion:LicenseKey"];

if (!string.IsNullOrWhiteSpace(syncfusionLicenseKey))
{
    Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(syncfusionLicenseKey);
}

var useInMemoryOverlay = !builder.Environment.IsDevelopment();

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration, useInMemoryOverlay);

if (useInMemoryOverlay)
{
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<IDemoSessionAccessor, HttpDemoSessionAccessor>();
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHealthChecks();

// CORS
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpaApps", policy =>
    {
        if (corsOrigins.Length == 0)
        {
            if (builder.Environment.IsDevelopment())
            {
                corsOrigins =
                [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:4200",
                    "http://127.0.0.1:4200"
                ];
            }
            else
            {
                throw new InvalidOperationException(
                    "Production CORS origins are not configured.");
            }
        }

        policy
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Seed database on startup in development
if (app.Environment.IsDevelopment())
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HealthcareDbContext>();
        await db.Database.MigrateAsync();

        var seederLogger = scope.ServiceProvider.GetRequiredService<ILogger<HealthcareDataSeeder>>();
        var seeder = new HealthcareDataSeeder(db, seederLogger);
        await seeder.SeedAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database migration/seeding failed. The API will continue running, but endpoints requiring persistence may fail until a database is available.");
    }
}

// Configure the HTTP request pipeline.
app.UseHttpsRedirection();
app.UseCors("AllowSpaApps");
app.UseStatusCodePages(async context =>

{

    var request = context.HttpContext.Request;
    var response = context.HttpContext.Response;

    if (response.StatusCode == 404)
    {
        if (request.Path.StartsWithSegments("/api"))
        {
            response.ContentType = "application/json";

            await response.WriteAsJsonAsync(new
            {
                Status = 404,
                Message = "The requested API endpoint was not found."
            });
        }
        else
        {
            response.Redirect("/404.html");
        }
    }
});
app.UseStaticFiles();
app.UseMiddleware<GlobalExceptionHandler>();
app.MapControllers();
app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        Status = "Healthy",
        Timestamp = DateTime.UtcNow,
        Environment = app.Environment.EnvironmentName,
        Version = "1.0.0"
    });
}); // Map health checks endpoint. Used for monitoring and health checks.

// Swagger JSON + UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Healthcare Appointment & Patient Operations Portal API v1");
        c.RoutePrefix = "swagger";          // browse at /swagger
    });
}

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.Run();
