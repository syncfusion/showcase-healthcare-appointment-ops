using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace HealthcareAppointmentOps.Application;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<IProviderService, ProviderService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IWaitlistService, WaitlistService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IAiService, AiService>();
        services.AddScoped<IReferenceDataService, ReferenceDataService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        // Read-only clinical data
        services.AddScoped<IClinicalHistoryService, ClinicalHistoryService>();
        services.AddScoped<IMedicationService, MedicationService>();
        // Documents, care plan, AI workflows
        services.AddScoped<IDocumentService, DocumentService>();
        return services;
    }
}
