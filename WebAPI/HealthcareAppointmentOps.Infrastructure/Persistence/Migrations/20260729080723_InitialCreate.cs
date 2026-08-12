using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthcareAppointmentOps.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogEntries",
                columns: table => new
                {
                    AuditId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PerformedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PerformedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogEntries", x => x.AuditId);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AddressLine = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TimeZone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.LocationId);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    DepartmentName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DepartmentCode = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.DepartmentId);
                    table.ForeignKey(
                        name: "FK_Departments_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Providers",
                columns: table => new
                {
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    NpiNumber = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Specialty = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    AverageAppointmentDuration = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Providers", x => x.ProviderId);
                    table.ForeignKey(
                        name: "FK_Providers_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Providers_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Patients",
                columns: table => new
                {
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicalRecordNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: false),
                    Gender = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AddressLine = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PreferredLanguage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PrimaryCareProviderId = table.Column<Guid>(type: "uuid", nullable: true),
                    InsuranceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RegistrationDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CommunicationPreferences = table.Column<string>(type: "text", nullable: false),
                    HasProxyAccess = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Patients", x => x.PatientId);
                    table.ForeignKey(
                        name: "FK_Patients_Providers_PrimaryCareProviderId",
                        column: x => x.PrimaryCareProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId");
                });

            migrationBuilder.CreateTable(
                name: "ScheduleTemplates",
                columns: table => new
                {
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    SlotDuration = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    EffectiveTo = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduleTemplates", x => x.TemplateId);
                    table.CheckConstraint("CK_ScheduleTemplate_TimeRange", "\"StartTime\" < \"EndTime\"");
                    table.ForeignKey(
                        name: "FK_ScheduleTemplates_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScheduleTemplates_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScheduleTemplates_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    AppointmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    AppointmentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ScheduledDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    ReasonForVisit = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    PatientInstructions = table.Column<string>(type: "text", nullable: false),
                    CancellationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CheckedInDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RoomNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CheckInSource = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appointments", x => x.AppointmentId);
                    table.CheckConstraint("CK_Appointment_Duration", "\"DurationMinutes\" > 0");
                    table.ForeignKey(
                        name: "FK_Appointments_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appointments_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appointments_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appointments_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CarePlans",
                columns: table => new
                {
                    CarePlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AuthorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SdoContent = table.Column<string>(type: "text", nullable: false),
                    InterventionsJson = table.Column<string>(type: "text", nullable: false),
                    FollowUpsJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarePlans", x => x.CarePlanId);
                    table.ForeignKey(
                        name: "FK_CarePlans_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UploadedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProviderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    PageCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.DocumentId);
                    table.ForeignKey(
                        name: "FK_Documents_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Encounters",
                columns: table => new
                {
                    EncounterId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    EncounterDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EncounterType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DepartmentName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Assessment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Plan = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Encounters", x => x.EncounterId);
                    table.ForeignKey(
                        name: "FK_Encounters_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LabResults",
                columns: table => new
                {
                    LabResultId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    CollectedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TestName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<double>(type: "double precision", nullable: false),
                    Unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReferenceRange = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsAbnormal = table.Column<bool>(type: "boolean", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LabResults", x => x.LabResultId);
                    table.ForeignKey(
                        name: "FK_LabResults_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Medications",
                columns: table => new
                {
                    MedicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Dosage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Frequency = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Route = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PrescriberName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StopReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RefillsRemaining = table.Column<int>(type: "integer", nullable: false),
                    Pharmacy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Medications", x => x.MedicationId);
                    table.ForeignKey(
                        name: "FK_Medications_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Referrals",
                columns: table => new
                {
                    ReferralId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Specialty = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FromProvider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Referrals", x => x.ReferralId);
                    table.ForeignKey(
                        name: "FK_Referrals_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VitalReadings",
                columns: table => new
                {
                    VitalReadingId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReadingDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Metric = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Value = table.Column<double>(type: "double precision", nullable: false),
                    Unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReferenceRange = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsAbnormal = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VitalReadings", x => x.VitalReadingId);
                    table.ForeignKey(
                        name: "FK_VitalReadings_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WaitlistEntries",
                columns: table => new
                {
                    WaitlistId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreferredProviderId = table.Column<Guid>(type: "uuid", nullable: true),
                    PreferredDepartmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreferredDateRangeStart = table.Column<DateOnly>(type: "date", nullable: false),
                    PreferredDateRangeEnd = table.Column<DateOnly>(type: "date", nullable: false),
                    PriorityScore = table.Column<int>(type: "integer", nullable: false),
                    UrgencyLevel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RequestedAppointmentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RequestDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MatchedAppointmentId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaitlistEntries", x => x.WaitlistId);
                    table.ForeignKey(
                        name: "FK_WaitlistEntries_Appointments_MatchedAppointmentId",
                        column: x => x.MatchedAppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "AppointmentId");
                    table.ForeignKey(
                        name: "FK_WaitlistEntries_Departments_PreferredDepartmentId",
                        column: x => x.PreferredDepartmentId,
                        principalTable: "Departments",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WaitlistEntries_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WaitlistEntries_Providers_PreferredProviderId",
                        column: x => x.PreferredProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId");
                });

            migrationBuilder.CreateTable(
                name: "CarePlanGoals",
                columns: table => new
                {
                    CarePlanGoalId = table.Column<Guid>(type: "uuid", nullable: false),
                    CarePlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Goal = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Target = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProgressPct = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarePlanGoals", x => x.CarePlanGoalId);
                    table.ForeignKey(
                        name: "FK_CarePlanGoals_CarePlans_CarePlanId",
                        column: x => x.CarePlanId,
                        principalTable: "CarePlans",
                        principalColumn: "CarePlanId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedicationRefills",
                columns: table => new
                {
                    MedicationRefillId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RefillDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicationRefills", x => x.MedicationRefillId);
                    table.ForeignKey(
                        name: "FK_MedicationRefills_Medications_MedicationId",
                        column: x => x.MedicationId,
                        principalTable: "Medications",
                        principalColumn: "MedicationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DepartmentId_LocationId",
                table: "Appointments",
                columns: new[] { "DepartmentId", "LocationId" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_LocationId",
                table: "Appointments",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PatientId_ScheduledDateTime",
                table: "Appointments",
                columns: new[] { "PatientId", "ScheduledDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ProviderId_ScheduledDateTime",
                table: "Appointments",
                columns: new[] { "ProviderId", "ScheduledDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ScheduledDateTime_Status",
                table: "Appointments",
                columns: new[] { "ScheduledDateTime", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Status_ScheduledDateTime",
                table: "Appointments",
                columns: new[] { "Status", "ScheduledDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntries_EntityType_EntityId",
                table: "AuditLogEntries",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntries_PerformedAt",
                table: "AuditLogEntries",
                column: "PerformedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CarePlanGoals_CarePlanId",
                table: "CarePlanGoals",
                column: "CarePlanId");

            migrationBuilder.CreateIndex(
                name: "IX_CarePlans_PatientId",
                table: "CarePlans",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_LocationId",
                table: "Departments",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_PatientId",
                table: "Documents",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_PatientId",
                table: "Encounters",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_LabResults_PatientId",
                table: "LabResults",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_IsActive",
                table: "Locations",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_MedicationRefills_MedicationId",
                table: "MedicationRefills",
                column: "MedicationId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicationRefills_PatientId",
                table: "MedicationRefills",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Medications_PatientId",
                table: "Medications",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_IsActive",
                table: "Patients",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_LastName_FirstName",
                table: "Patients",
                columns: new[] { "LastName", "FirstName" });

            migrationBuilder.CreateIndex(
                name: "IX_Patients_MedicalRecordNumber",
                table: "Patients",
                column: "MedicalRecordNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patients_PrimaryCareProviderId",
                table: "Patients",
                column: "PrimaryCareProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Providers_DepartmentId",
                table: "Providers",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Providers_IsActive",
                table: "Providers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Providers_LocationId",
                table: "Providers",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Providers_Specialty_DepartmentId",
                table: "Providers",
                columns: new[] { "Specialty", "DepartmentId" });

            migrationBuilder.CreateIndex(
                name: "IX_Referrals_PatientId",
                table: "Referrals",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleTemplates_DepartmentId",
                table: "ScheduleTemplates",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleTemplates_LocationId",
                table: "ScheduleTemplates",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleTemplates_ProviderId_DayOfWeek",
                table: "ScheduleTemplates",
                columns: new[] { "ProviderId", "DayOfWeek" });

            migrationBuilder.CreateIndex(
                name: "IX_VitalReadings_PatientId",
                table: "VitalReadings",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_WaitlistEntries_MatchedAppointmentId",
                table: "WaitlistEntries",
                column: "MatchedAppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WaitlistEntries_PatientId",
                table: "WaitlistEntries",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_WaitlistEntries_PreferredDepartmentId_Status",
                table: "WaitlistEntries",
                columns: new[] { "PreferredDepartmentId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_WaitlistEntries_PreferredProviderId",
                table: "WaitlistEntries",
                column: "PreferredProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_WaitlistEntries_PriorityScore_Status",
                table: "WaitlistEntries",
                columns: new[] { "PriorityScore", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogEntries");

            migrationBuilder.DropTable(
                name: "CarePlanGoals");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "Encounters");

            migrationBuilder.DropTable(
                name: "LabResults");

            migrationBuilder.DropTable(
                name: "MedicationRefills");

            migrationBuilder.DropTable(
                name: "Referrals");

            migrationBuilder.DropTable(
                name: "ScheduleTemplates");

            migrationBuilder.DropTable(
                name: "VitalReadings");

            migrationBuilder.DropTable(
                name: "WaitlistEntries");

            migrationBuilder.DropTable(
                name: "CarePlans");

            migrationBuilder.DropTable(
                name: "Medications");

            migrationBuilder.DropTable(
                name: "Appointments");

            migrationBuilder.DropTable(
                name: "Patients");

            migrationBuilder.DropTable(
                name: "Providers");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "Locations");
        }
    }
}
