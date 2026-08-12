using HealthcareAppointmentOps.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAppointmentOps.Infrastructure.Persistence;

public class HealthcareDbContext : DbContext
{
    public HealthcareDbContext(DbContextOptions<HealthcareDbContext> options) : base(options) { }

    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<ScheduleTemplate> ScheduleTemplates => Set<ScheduleTemplate>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<WaitlistEntry> WaitlistEntries => Set<WaitlistEntry>();
    public DbSet<AuditLogEntry> AuditLogEntries => Set<AuditLogEntry>();
    public DbSet<Encounter> Encounters => Set<Encounter>();
    public DbSet<VitalReading> VitalReadings => Set<VitalReading>();
    public DbSet<LabResult> LabResults => Set<LabResult>();
    public DbSet<Referral> Referrals => Set<Referral>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<MedicationRefill> MedicationRefills => Set<MedicationRefill>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<CarePlan> CarePlans => Set<CarePlan>();
    public DbSet<CarePlanGoal> CarePlanGoals => Set<CarePlanGoal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Location>(e =>
        {
            e.HasKey(x => x.LocationId);
            e.Property(x => x.LocationName).HasMaxLength(200);
            e.Property(x => x.AddressLine).HasMaxLength(300);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.State).HasMaxLength(2);
            e.Property(x => x.PostalCode).HasMaxLength(20);
            e.Property(x => x.PhoneNumber).HasMaxLength(50);
            e.Property(x => x.TimeZone).HasMaxLength(50);
            e.HasIndex(x => x.IsActive);
        });

        modelBuilder.Entity<Department>(e =>
        {
            e.HasKey(x => x.DepartmentId);
            e.Property(x => x.DepartmentName).HasMaxLength(200);
            e.Property(x => x.DepartmentCode).HasMaxLength(3);
            e.HasOne(x => x.Location).WithMany(x => x.Departments).HasForeignKey(x => x.LocationId);
            e.HasIndex(x => x.LocationId);
        });

        modelBuilder.Entity<Provider>(e =>
        {
            e.HasKey(x => x.ProviderId);
            e.Property(x => x.NpiNumber).HasMaxLength(10);
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.Specialty).HasMaxLength(100);
            e.Property(x => x.Title).HasMaxLength(10);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.PhoneNumber).HasMaxLength(50);
            e.HasOne(x => x.Department).WithMany(x => x.Providers).HasForeignKey(x => x.DepartmentId);
            e.HasOne(x => x.Location).WithMany(x => x.Providers).HasForeignKey(x => x.LocationId);
            e.HasIndex(x => new { x.Specialty, x.DepartmentId });
            e.HasIndex(x => x.IsActive);
        });

        modelBuilder.Entity<Patient>(e =>
        {
            e.HasKey(x => x.PatientId);
            e.Property(x => x.MedicalRecordNumber).HasMaxLength(50);
            e.HasIndex(x => x.MedicalRecordNumber).IsUnique();
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.Gender).HasMaxLength(20);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.PhoneNumber).HasMaxLength(50);
            e.Property(x => x.AddressLine).HasMaxLength(300);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.State).HasMaxLength(2);
            e.Property(x => x.PostalCode).HasMaxLength(20);
            e.Property(x => x.PreferredLanguage).HasMaxLength(50);
            e.Property(x => x.InsuranceType).HasMaxLength(100);
            e.HasOne(x => x.PrimaryCareProvider).WithMany(x => x.PrimaryCarePatients).HasForeignKey(x => x.PrimaryCareProviderId);
            e.HasIndex(x => new { x.LastName, x.FirstName });
            e.HasIndex(x => x.IsActive);
        });

        modelBuilder.Entity<ScheduleTemplate>(e =>
        {
            e.HasKey(x => x.TemplateId);
            e.HasOne(x => x.Provider).WithMany(x => x.ScheduleTemplates).HasForeignKey(x => x.ProviderId);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId);
            e.HasOne(x => x.Location).WithMany().HasForeignKey(x => x.LocationId);
            e.HasIndex(x => new { x.ProviderId, x.DayOfWeek });
            e.HasCheckConstraint("CK_ScheduleTemplate_TimeRange", "\"StartTime\" < \"EndTime\"");
        });

        modelBuilder.Entity<Appointment>(e =>
        {
            e.HasKey(x => x.AppointmentId);
            e.Property(x => x.Status).HasMaxLength(50);
            e.Property(x => x.AppointmentType).HasMaxLength(100);
            e.Property(x => x.ReasonForVisit).HasMaxLength(500);
            e.Property(x => x.CancellationReason).HasMaxLength(500);
            e.Property(x => x.RoomNumber).HasMaxLength(20);
            e.Property(x => x.CheckInSource).HasMaxLength(50);
            e.HasOne(x => x.Patient).WithMany(x => x.Appointments).HasForeignKey(x => x.PatientId);
            e.HasOne(x => x.Provider).WithMany(x => x.Appointments).HasForeignKey(x => x.ProviderId);
            e.HasOne(x => x.Department).WithMany(x => x.Appointments).HasForeignKey(x => x.DepartmentId);
            e.HasOne(x => x.Location).WithMany(x => x.Appointments).HasForeignKey(x => x.LocationId);
            e.HasIndex(x => new { x.PatientId, x.ScheduledDateTime });
            e.HasIndex(x => new { x.ProviderId, x.ScheduledDateTime });
            e.HasIndex(x => new { x.Status, x.ScheduledDateTime });
            e.HasIndex(x => new { x.DepartmentId, x.LocationId });
            e.HasIndex(x => new { x.ScheduledDateTime, x.Status });
            e.HasCheckConstraint("CK_Appointment_Duration", "\"DurationMinutes\" > 0");
        });

        modelBuilder.Entity<WaitlistEntry>(e =>
        {
            e.HasKey(x => x.WaitlistId);
            e.Property(x => x.UrgencyLevel).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(50);
            e.Property(x => x.RequestedAppointmentType).HasMaxLength(100);
            e.HasOne(x => x.Patient).WithMany(x => x.WaitlistEntries).HasForeignKey(x => x.PatientId);
            e.HasOne(x => x.PreferredProvider).WithMany().HasForeignKey(x => x.PreferredProviderId);
            e.HasOne(x => x.PreferredDepartment).WithMany().HasForeignKey(x => x.PreferredDepartmentId);
            e.HasOne(x => x.MatchedAppointment).WithOne(x => x.MatchedWaitlistEntry).HasForeignKey<WaitlistEntry>(x => x.MatchedAppointmentId);
            e.HasIndex(x => new { x.PriorityScore, x.Status });
            e.HasIndex(x => new { x.PreferredDepartmentId, x.Status });
        });

        modelBuilder.Entity<AuditLogEntry>(e =>
        {
            e.HasKey(x => x.AuditId);
            e.Property(x => x.EntityType).HasMaxLength(100);
            e.Property(x => x.Action).HasMaxLength(50);
            e.Property(x => x.PerformedBy).HasMaxLength(200);
            e.Property(x => x.IpAddress).HasMaxLength(50);
            e.HasIndex(x => new { x.EntityType, x.EntityId });
            e.HasIndex(x => x.PerformedAt);
        });

        // Per-patient clinical data (read on the patient detail tabs). FK to Patient with no
        // back-navigation to keep the Patient entity lean; each is queried by PatientId.
        modelBuilder.Entity<Encounter>(e =>
        {
            e.HasKey(x => x.EncounterId);
            e.Property(x => x.EncounterType).HasMaxLength(50);
            e.Property(x => x.ProviderName).HasMaxLength(200);
            e.Property(x => x.DepartmentName).HasMaxLength(200);
            e.Property(x => x.Reason).HasMaxLength(500);
            e.Property(x => x.Assessment).HasMaxLength(1000);
            e.Property(x => x.Plan).HasMaxLength(1000);
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasIndex(x => x.PatientId);
        });

        modelBuilder.Entity<VitalReading>(e =>
        {
            e.HasKey(x => x.VitalReadingId);
            e.Property(x => x.Metric).HasMaxLength(50);
            e.Property(x => x.Unit).HasMaxLength(20);
            e.Property(x => x.ReferenceRange).HasMaxLength(50);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasIndex(x => x.PatientId);
        });

        modelBuilder.Entity<LabResult>(e =>
        {
            e.HasKey(x => x.LabResultId);
            e.Property(x => x.TestName).HasMaxLength(100);
            e.Property(x => x.Unit).HasMaxLength(20);
            e.Property(x => x.ReferenceRange).HasMaxLength(50);
            e.Property(x => x.Category).HasMaxLength(50);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasIndex(x => x.PatientId);
        });

        modelBuilder.Entity<Referral>(e =>
        {
            e.HasKey(x => x.ReferralId);
            e.Property(x => x.Specialty).HasMaxLength(100);
            e.Property(x => x.Reason).HasMaxLength(500);
            e.Property(x => x.FromProvider).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasIndex(x => x.PatientId);
        });

        modelBuilder.Entity<Medication>(e =>
        {
            e.HasKey(x => x.MedicationId);
            e.Property(x => x.MedicationName).HasMaxLength(200);
            e.Property(x => x.Dosage).HasMaxLength(50);
            e.Property(x => x.Frequency).HasMaxLength(50);
            e.Property(x => x.Route).HasMaxLength(50);
            e.Property(x => x.PrescriberName).HasMaxLength(200);
            e.Property(x => x.StopReason).HasMaxLength(200);
            e.Property(x => x.Pharmacy).HasMaxLength(100);
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasIndex(x => x.PatientId);
        });

        modelBuilder.Entity<MedicationRefill>(e =>
        {
            e.HasKey(x => x.MedicationRefillId);
            e.Property(x => x.MedicationName).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasOne(x => x.Medication).WithMany(x => x.Refills).HasForeignKey(x => x.MedicationId);
            e.HasIndex(x => x.PatientId);
        });

        modelBuilder.Entity<Document>(e =>
        {
            e.HasKey(x => x.DocumentId);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Type).HasMaxLength(100);
            e.Property(x => x.ProviderName).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(50);
            e.Property(x => x.Url).HasMaxLength(500);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasIndex(x => x.PatientId);
        });

        modelBuilder.Entity<CarePlan>(e =>
        {
            e.HasKey(x => x.CarePlanId);
            e.Property(x => x.Title).HasMaxLength(300);
            e.Property(x => x.Version).HasMaxLength(20);
            e.Property(x => x.AuthorName).HasMaxLength(200);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasIndex(x => x.PatientId);
        });

        modelBuilder.Entity<CarePlanGoal>(e =>
        {
            e.HasKey(x => x.CarePlanGoalId);
            e.Property(x => x.Goal).HasMaxLength(500);
            e.Property(x => x.Target).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasOne(x => x.CarePlan).WithMany(x => x.Goals).HasForeignKey(x => x.CarePlanId);
            e.HasIndex(x => x.CarePlanId);
        });
    }
}
