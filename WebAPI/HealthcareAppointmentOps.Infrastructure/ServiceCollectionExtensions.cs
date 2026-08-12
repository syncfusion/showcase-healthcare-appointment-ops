using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Infrastructure.Persistence;
using HealthcareAppointmentOps.Infrastructure.Pdf;
using HealthcareAppointmentOps.Infrastructure.Repositories;
using HealthcareAppointmentOps.Infrastructure.Repositories.Overlay;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HealthcareAppointmentOps.Infrastructure;

public static class ServiceCollectionExtensions
{
    /// <param name="useInMemoryOverlay">
    /// When true writes are captured in a per-session
    /// in-memory overlay and never persisted; when false they write to PostgreSQL.
    /// </param>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, bool useInMemoryOverlay)
    {
        services.AddDbContext<HealthcareDbContext>(options =>
        {
            var connectionString = configuration.GetConnectionString("HealthcareDatabase");
            options.UseNpgsql(connectionString ?? "Host=localhost;Database=healthcareops;Username=YOUR_USER_NAME;Password=YOUR_PASSWORD;Include Error Detail=true;");
        });

        services.AddScoped<IProviderRepository, ProviderRepository>();
        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<IScheduleTemplateRepository, ScheduleTemplateRepository>();
        services.AddScoped<IClinicalHistoryRepository, ClinicalHistoryRepository>();
        services.AddScoped<IMedicationRepository, MedicationRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();

        services.AddSingleton<IDocumentPdfRenderer, LabReportPdfRenderer>();

        if (!useInMemoryOverlay)
        {
            services.AddScoped<IPatientRepository, PatientRepository>();
            services.AddScoped<IAppointmentRepository, AppointmentRepository>();
            services.AddScoped<IWaitlistRepository, WaitlistRepository>();
            services.AddScoped<IAuditLogRepository, AuditLogRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
        }
        else
        {
            services.AddSingleton(typeof(IInMemoryOverrideStore<,>), typeof(InMemoryOverrideStore<,>));

            services.AddScoped<PatientRepository>();
            services.AddScoped<AppointmentRepository>();
            services.AddScoped<WaitlistRepository>();
            services.AddScoped<AuditLogRepository>();

            services.AddScoped<IPatientRepository, OverlayPatientRepository>();
            services.AddScoped<IAppointmentRepository, OverlayAppointmentRepository>();
            services.AddScoped<IWaitlistRepository, OverlayWaitlistRepository>();
            services.AddScoped<IAuditLogRepository, OverlayAuditLogRepository>();

            services.AddScoped<IUnitOfWork, NoOpUnitOfWork>();
        }

        return services;
    }
}
