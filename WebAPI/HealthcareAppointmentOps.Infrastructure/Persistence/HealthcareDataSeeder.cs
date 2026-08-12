using System.Text.Json;
using HealthcareAppointmentOps.Application.Services;
using HealthcareAppointmentOps.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HealthcareAppointmentOps.Infrastructure.Persistence;

public class HealthcareDataSeeder(HealthcareDbContext db, ILogger<HealthcareDataSeeder> logger)
{
    // Tunable showcase volumes.
    private const int PatientCount = 500;
    private const int ProvidersPerDepartment = 3;
    private const int WaitlistCount = 800;
    private const int AuditLogCount = 5_000;
    private const int AppointmentPastDays = 180;   // history window for reports
    private const int AppointmentFutureDays = 120; // upcoming schedule window
    private const int MinAppointmentsPerProviderDay = 3;
    private const int MaxAppointmentsPerProviderDay = 4;

    // Gender-specific name pools so a patient's name and Gender are always consistent.
    private static readonly string[] MaleFirstNames =
    [
        "James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph", "Thomas",
        "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul",
        "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Edward", "Ronald", "Timothy",
        "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen",
        "Larry", "Justin", "Scott", "Brandon"
    ];

    private static readonly string[] FemaleFirstNames =
    [
        "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen",
        "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna",
        "Michelle", "Dorothy", "Carol", "Amanda", "Melissa", "Deborah", "Stephanie", "Rebecca",
        "Sharon", "Laura", "Cynthia", "Kathleen", "Amy", "Shirley", "Angela", "Helen", "Anna",
        "Brenda", "Pamela", "Nicole", "Emma", "Samantha"
    ];

    private static readonly string[] LastNames =
    [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
        "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor",
        "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez",
        "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright",
        "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall",
        "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner",
        "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales",
        "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
        "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks",
        "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez",
        "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez", "Powell",
        "Jenkins", "Perry", "Russell", "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes",
        "Gonzales", "Fisher", "Vasquez", "Simmons", "Romero", "Jordan", "Patterson", "Alexander",
        "Hamilton", "Graham", "Reynolds", "Griffin", "Wallace", "Moreno", "West", "Cole", "Hayes",
        "Bryant", "Herrera", "Gibson", "Ellis", "Tran", "Medina", "Aguilar", "Stevens", "Murray",
        "Ford", "Castro", "Marshall", "Owens", "Harrison", "Fernandez", "Mcdonald", "Woods", "Washington",
        "Kennedy", "Wells", "Vargas", "Henry", "Chen", "Freeman", "Webb", "Tucker", "Guzman", "Burns",
        "Crawford", "Olson", "Simpson", "Porter", "Hunter", "Gordon", "Mendez", "Silva", "Shaw",
        "Snyder", "Mason", "Dixon", "Hunt", "Hicks", "Holmes", "Palmer", "Wagner", "Black", "Robertson"
    ];

    // Each department maps to its single clinically-correct specialty so a provider's Specialty
    // always matches their Department (and the providers grid renders consistent values).
    private static readonly Dictionary<string, string> DepartmentSpecialtyMap = new()
    {
        ["Internal Medicine"] = "Internal Medicine",
        ["Pediatrics"] = "Pediatrics",
        ["Cardiology"] = "Cardiology",
        ["Orthopedics"] = "Orthopedics",
        ["Dermatology"] = "Dermatology",
        ["Neurology"] = "Neurology",
        ["Obstetrics & Gynecology"] = "Obstetrics & Gynecology",
        ["Ophthalmology"] = "Ophthalmology",
        ["ENT"] = "ENT"
    };

    // Specialties that act as a patient's Primary Care Provider.
    private static readonly string[] PrimaryCareSpecialties = ["Internal Medicine", "Pediatrics"];

    private static readonly string[] InsuranceTypes =
    ["Private", "Medicare", "Medicaid", "Self-Pay", "VA"];

    private static readonly string[] AppointmentTypes =
    ["New Patient", "Follow-Up", "Annual Physical", "Urgent Care", "Consultation", "Procedure", "Lab Review", "Telehealth"];

    private static readonly string[] RecurringAppointmentTypes =
    ["Follow-Up", "Urgent Care", "Consultation", "Procedure", "Lab Review", "Telehealth"];

    private static readonly string[] UrgencyLevels = ["Routine", "Soon", "Urgent"];

    private static readonly string[][] DocCatalog =
    [
        ["Lab Report", "Lab_Report.pdf", "Comprehensive metabolic and lipid panel results"]
    ];

    private readonly Random _random = new(Guid.NewGuid().GetHashCode());

    public async Task SeedAsync()
    {
        List<Location> locations;
        if (!await db.Locations.AnyAsync())
        {
            logger.LogInformation("Seeding {Table}…", "Locations");
            locations = SeedLocations();
            await db.Locations.AddRangeAsync(locations);
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Table}: {count} rows", "Locations", locations.Count);
        }
        else
        {
            locations = await db.Locations.AsNoTracking().ToListAsync();
        }

        List<Department> departments;
        if (!await db.Departments.AnyAsync())
        {
            logger.LogInformation("Seeding {Table}…", "Departments");
            departments = SeedDepartments(locations);
            await db.Departments.AddRangeAsync(departments);
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Table}: {count} rows", "Departments", departments.Count);
        }
        else
        {
            departments = await db.Departments.AsNoTracking().ToListAsync();
        }

        List<Provider> providers;
        if (!await db.Providers.AnyAsync())
        {
            logger.LogInformation("Seeding {Table}…", "Providers");
            providers = SeedProviders(departments, locations);
            await db.Providers.AddRangeAsync(providers);
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Table}: {count} rows", "Providers", providers.Count);
        }
        else
        {
            providers = await db.Providers.AsNoTracking().ToListAsync();
        }

        List<Patient> patients;
        if (!await db.Patients.AnyAsync())
        {
            logger.LogInformation("Seeding {Table}…", "Patients");
            patients = SeedPatients(providers, locations);
            await db.Patients.AddRangeAsync(patients);
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Table}: {count} rows", "Patients", patients.Count);
        }
        else
        {
            patients = await db.Patients.AsNoTracking().ToListAsync();
        }

        if (!await db.ScheduleTemplates.AnyAsync())
        {
            logger.LogInformation("Seeding {Table}…", "ScheduleTemplates");
            var templates = SeedScheduleTemplates(providers);
            await db.ScheduleTemplates.AddRangeAsync(templates);
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Table}: {count} rows", "ScheduleTemplates", templates.Count);
        }

        List<Appointment> appointments = [];
        if (!await db.Appointments.AnyAsync())
        {
            logger.LogInformation("Seeding {Table}…", "Appointments");
            appointments = SeedAppointments(patients, providers, departments, locations);
            await BatchInsertAsync(appointments, "Appointments");

            if (!await db.AuditLogEntries.AnyAsync())
            {
                logger.LogInformation("Seeding {Table}…", "AuditLogEntries");
                var auditLogs = SeedAuditLogs(patients, providers, appointments);
                await BatchInsertAsync(auditLogs, "AuditLogEntries");
            }
        }

        if (!await db.WaitlistEntries.AnyAsync())
        {
            logger.LogInformation("Seeding {Table}…", "WaitlistEntries");
            var waitlist = SeedWaitlist(patients, providers, departments);
            await db.WaitlistEntries.AddRangeAsync(waitlist);
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Table}: {count} rows", "WaitlistEntries", waitlist.Count);
        }

        if (!await db.Encounters.AnyAsync())
        {
            await SeedClinicalDataAsync(patients, providers);
        }
    }

    private List<Location> SeedLocations()
    {
        var cities = new[]
        {
            ("Meridian — Metro General", "123 Main St", "Springfield", "IL", "62701", "Central"),
            ("Meridian — Westside", "456 Oak Avenue", "Denver", "CO", "80202", "Mountain"),
            ("Meridian — Eastview", "789 Pine Road", "Boston", "MA", "02101", "Eastern"),
            ("Meridian — Southpoint", "321 Cedar Blvd", "Austin", "TX", "73301", "Central"),
            ("Meridian — Northfield", "654 Birch Lane", "Seattle", "WA", "98101", "Pacific")
        };
        return cities.Select((c, i) => new Location
        {
            LocationId = Guid.NewGuid(),
            LocationName = c.Item1,
            AddressLine = c.Item2,
            City = c.Item3,
            State = c.Item4,
            PostalCode = c.Item5,
            PhoneNumber = $"555-{100 + i:D3}-{1000 + i:D4}",
            TimeZone = c.Item6,
            IsActive = true
        }).ToList();
    }

    private List<Department> SeedDepartments(List<Location> locations)
    {
        var deptDefs = new[]
        {
            ("Internal Medicine", "IMD"),
            ("Pediatrics", "PED"),
            ("Cardiology", "CRD"),
            ("Orthopedics", "ORT"),
            ("Dermatology", "DER"),
            ("Neurology", "NEU"),
            ("Obstetrics & Gynecology", "OBG"),
            ("Ophthalmology", "OPH"),
            ("ENT", "ENT")
        };

        var departments = new List<Department>();
        foreach (var loc in locations)
        {
            foreach (var d in deptDefs)
            {
                departments.Add(new Department
                {
                    DepartmentId = Guid.NewGuid(),
                    DepartmentName = d.Item1,
                    DepartmentCode = d.Item2,
                    LocationId = loc.LocationId,
                    IsActive = true
                });
            }
        }
        return departments;
    }

    private List<Provider> SeedProviders(List<Department> departments, List<Location> locations)
    {
        var providers = new List<Provider>();
        var index = 0;
        foreach (var dept in departments)
        {
            var specialty = DepartmentSpecialtyMap[dept.DepartmentName];
            for (var i = 0; i < ProvidersPerDepartment; i++)
            {
                index++;
                var isFemale = _random.Next(2) == 0;
                providers.Add(new Provider
                {
                    ProviderId = Guid.NewGuid(),
                    NpiNumber = $"{_random.Next(100000000, 1000000000)}",
                    FirstName = PickFirstName(isFemale),
                    LastName = LastNames[_random.Next(LastNames.Length)],
                    Specialty = specialty,
                    Title = _random.NextDouble() > 0.2 ? "MD" : "DO",
                    Email = $"provider{index}@healthcare.local",
                    PhoneNumber = $"555-200-{1000 + index:D4}",
                    DepartmentId = dept.DepartmentId,
                    LocationId = dept.LocationId,
                    IsActive = true,
                    AverageAppointmentDuration = DurationForSpecialty(specialty)
                });
            }
        }
        return providers;
    }

    private List<Patient> SeedPatients(List<Provider> providers, List<Location> locations)
    {
        var pcpPool = providers.Where(p => PrimaryCareSpecialties.Contains(p.Specialty)).ToList();
        if (pcpPool.Count == 0) pcpPool = providers; // safety net
        var locationsById = locations.ToDictionary(l => l.LocationId);

        var patients = new List<Patient>();
        for (var i = 0; i < PatientCount; i++)
        {
            var isFemale = _random.Next(2) == 0;
            var pcp = pcpPool[_random.Next(pcpPool.Count)];
            var loc = locationsById[pcp.LocationId];
            var dob = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-_random.Next(18, 90)).AddDays(-_random.Next(0, 365)));

            patients.Add(new Patient
            {
                PatientId = Guid.NewGuid(),
                MedicalRecordNumber = $"MRN-{(i + 1):D7}",
                FirstName = PickFirstName(isFemale),
                LastName = LastNames[_random.Next(LastNames.Length)],
                DateOfBirth = dob,
                Gender = isFemale ? "Female" : "Male",
                Email = $"patient{i + 1}@example.com",
                PhoneNumber = $"555-{300 + _random.Next(0, 600):D3}-{1000 + _random.Next(0, 9000):D4}",
                AddressLine = $"{_random.Next(100, 9999)} {(_random.NextDouble() > 0.5 ? "Maple" : "Oak")} {(_random.NextDouble() > 0.5 ? "Street" : "Avenue")}",
                // Address tied to the PCP's location so city/state/postal are a valid combination.
                City = loc.City,
                State = loc.State,
                PostalCode = loc.PostalCode,
                PreferredLanguage = "English",
                PrimaryCareProviderId = pcp.ProviderId,
                InsuranceType = InsuranceTypes[_random.Next(InsuranceTypes.Length)],
                // Registered 200–900 days ago, always before any seeded appointment.
                RegistrationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-_random.Next(200, 900))),
                IsActive = true,
                CommunicationPreferences = "{\"sms\":true,\"email\":true,\"phone\":false,\"portal\":true}",
                HasProxyAccess = false
            });
        }
        return patients;
    }

    private List<ScheduleTemplate> SeedScheduleTemplates(List<Provider> providers)
    {
        var templates = new List<ScheduleTemplate>();
        foreach (var provider in providers)
        {
            for (var dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++)
            {
                var startHour = _random.Next(7, 12);
                var endHour = startHour + _random.Next(4, 9);
                templates.Add(new ScheduleTemplate
                {
                    TemplateId = Guid.NewGuid(),
                    ProviderId = provider.ProviderId,
                    DepartmentId = provider.DepartmentId,
                    LocationId = provider.LocationId,
                    DayOfWeek = dayOfWeek, // Mon-Fri
                    StartTime = new TimeOnly(startHour, _random.Next(0, 4) * 15),
                    EndTime = new TimeOnly(endHour, 0),
                    SlotDuration = provider.AverageAppointmentDuration,
                    IsActive = true,
                    EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-AppointmentPastDays)),
                    EffectiveTo = null
                });
            }
        }
        return templates;
    }

    private List<Appointment> SeedAppointments(List<Patient> patients, List<Provider> providers, List<Department> departments, List<Location> locations)
    {
        var appointments = new List<Appointment>();
        var pastStatuses = new[] { "Completed", "Completed", "Completed", "Completed", "NoShow", "Cancelled" };
        var todayStatuses = new[] { "CheckedIn", "InProgress", "Completed" };
        var futureStatuses = new[] { "Scheduled", "Scheduled", "Confirmed" };
        var today = DateTime.UtcNow.Date;

        var deptById = departments.ToDictionary(d => d.DepartmentId);
        var locById = locations.ToDictionary(l => l.LocationId);

        foreach (var provider in providers)
        {
            var dept = deptById[provider.DepartmentId];
            var loc = locById[provider.LocationId];

            for (var offset = -AppointmentPastDays; offset <= AppointmentFutureDays; offset++)
            {
                var scheduledDate = today.AddDays(offset);
                var isWeekend = scheduledDate.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
                if (isWeekend && scheduledDate != today) continue;

                var perDay = _random.Next(MinAppointmentsPerProviderDay, MaxAppointmentsPerProviderDay + 1);
                var slots = PickDaySlots(perDay);

                for (var s = 0; s < perDay; s++)
                {
                    var patient = patients[_random.Next(patients.Count)];
                    var scheduledDateTime = DateTime.SpecifyKind(scheduledDate.Add(slots[s].ToTimeSpan()), DateTimeKind.Utc);

                    string status;
                    if (scheduledDate < today) status = pastStatuses[_random.Next(pastStatuses.Length)];
                    else if (scheduledDate == today) status = todayStatuses[_random.Next(todayStatuses.Length)];
                    else status = futureStatuses[_random.Next(futureStatuses.Length)];

                    DateTime? checkedIn = null;
                    DateTime? completed = null;
                    string? cancellationReason = null;

                    if (status is "CheckedIn" or "InProgress" or "Completed")
                        checkedIn = DateTime.SpecifyKind(scheduledDateTime.AddMinutes(_random.Next(0, 15)), DateTimeKind.Utc);
                    if (status == "Completed")
                        completed = DateTime.SpecifyKind(checkedIn!.Value.AddMinutes(provider.AverageAppointmentDuration + _random.Next(-5, 10)), DateTimeKind.Utc);
                    if (status == "Cancelled")
                        cancellationReason = _random.NextDouble() > 0.5 ? "Patient request" : "Provider unavailable";

                    appointments.Add(new Appointment
                    {
                        AppointmentId = Guid.NewGuid(),
                        PatientId = patient.PatientId,
                        ProviderId = provider.ProviderId,
                        DepartmentId = dept.DepartmentId,
                        LocationId = loc.LocationId,
                        AppointmentType = RecurringAppointmentTypes[_random.Next(RecurringAppointmentTypes.Length)],
                        Status = status,
                        ScheduledDateTime = scheduledDateTime,
                        DurationMinutes = provider.AverageAppointmentDuration,
                        ReasonForVisit = "Routine follow-up",
                        Notes = string.Empty,
                        PatientInstructions = string.Empty,
                        CancellationReason = cancellationReason,
                        CreatedDateTime = DateTime.SpecifyKind(scheduledDateTime.AddDays(-_random.Next(1, 30)), DateTimeKind.Utc),
                        CheckedInDateTime = checkedIn,
                        CompletedDateTime = completed,
                        RoomNumber = $"{_random.Next(100, 500)}",
                        CheckInSource = checkedIn != null ? "Kiosk" : null
                    });
                }
            }
        }

        foreach (var patientAppts in appointments.GroupBy(a => a.PatientId))
        {
            var ordered = patientAppts.OrderBy(a => a.ScheduledDateTime).ToList();
            ordered[0].AppointmentType = "New Patient";
            if (ordered.Count > 1)
            {
                var physicalIndex = _random.Next(1, ordered.Count);
                ordered[physicalIndex].AppointmentType = "Annual Physical";
            }
        }

        return appointments;
    }

    private List<TimeOnly> PickDaySlots(int count)
    {
        var candidates = new List<TimeOnly>();
        for (var hour = 8; hour < 17; hour++)
            for (var minute = 0; minute < 60; minute += 15)
                candidates.Add(new TimeOnly(hour, minute));

        for (var i = 0; i < count && i < candidates.Count; i++)
        {
            var j = _random.Next(i, candidates.Count);
            (candidates[i], candidates[j]) = (candidates[j], candidates[i]);
        }
        return candidates.Take(count).OrderBy(t => t).ToList();
    }

    private List<WaitlistEntry> SeedWaitlist(List<Patient> patients, List<Provider> providers, List<Department> departments)
    {
        var waitlist = new List<WaitlistEntry>();
        for (int i = 0; i < WaitlistCount; i++)
        {
            var patient = patients[_random.Next(patients.Count)];
            // Distribute evenly across departments so no department starves of waitlist data.
            var dept = departments[i % departments.Count];
            var deptProviders = providers.Where(p => p.DepartmentId == dept.DepartmentId).ToList();
            var provider = _random.NextDouble() > 0.3 && deptProviders.Count > 0
                ? deptProviders[_random.Next(deptProviders.Count)]
                : null;
            var urgency = UrgencyLevels[_random.Next(UrgencyLevels.Length)];
            var roll = _random.NextDouble();
            var status = roll < 0.55 ? "Open"
                : roll < 0.75 ? "Matched"
                : roll < 0.90 ? "ClosedExpired"
                : "ClosedCancelled";
            var start = NextWeekday(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(_random.Next(1, 30))));
            var end = start.AddDays(_random.Next(7, 30));

            waitlist.Add(new WaitlistEntry
            {
                WaitlistId = Guid.NewGuid(),
                PatientId = patient.PatientId,
                PreferredProviderId = provider?.ProviderId,
                PreferredDepartmentId = dept.DepartmentId,
                PreferredDateRangeStart = start,
                PreferredDateRangeEnd = end,
                PriorityScore = urgency == "Urgent" ? _random.Next(80, 101) : urgency == "Soon" ? _random.Next(50, 80) : _random.Next(10, 50),
                UrgencyLevel = urgency,
                RequestedAppointmentType = AppointmentTypes[_random.Next(AppointmentTypes.Length)],
                RequestDateTime = DateTime.UtcNow.AddDays(-_random.Next(0, 30)),
                Status = status,
                MatchedAppointmentId = null
            });
        }
        return waitlist;
    }

    private static DateOnly NextWeekday(DateOnly date)
    {
        return date.DayOfWeek switch
        {
            DayOfWeek.Saturday => date.AddDays(2),
            DayOfWeek.Sunday => date.AddDays(1),
            _ => date
        };
    }

    private List<AuditLogEntry> SeedAuditLogs(List<Patient> patients, List<Provider> providers, List<Appointment> appointments)
    {
        var logs = new List<AuditLogEntry>();
        var actions = new[] { "Created", "Updated", "StatusChanged", "Cancelled", "CheckedIn" };
        var entities = new[] { "Patient", "Provider", "Appointment" };

        for (int i = 0; i < AuditLogCount; i++)
        {
            var entityType = entities[_random.Next(entities.Length)];
            Guid entityId = entityType switch
            {
                "Patient" => patients[_random.Next(patients.Count)].PatientId,
                "Provider" => providers[_random.Next(providers.Count)].ProviderId,
                _ => appointments.Count > 0 ? appointments[_random.Next(appointments.Count)].AppointmentId : Guid.NewGuid()
            };

            logs.Add(new AuditLogEntry
            {
                AuditId = Guid.NewGuid(),
                EntityType = entityType,
                EntityId = entityId,
                Action = actions[_random.Next(actions.Length)],
                PerformedBy = $"user{_random.Next(1, 50)}@healthcare.local",
                PerformedAt = DateTime.UtcNow.AddDays(-_random.Next(0, AppointmentPastDays)).AddHours(-_random.Next(0, 24)),
                IpAddress = $"192.168.{_random.Next(0, 256)}.{_random.Next(0, 256)}",
                Details = "{}"
            });
        }
        return logs;
    }

    private async Task SeedClinicalDataAsync(List<Patient> patients, List<Provider> providers)
    {
        logger.LogInformation("Seeding clinical data for {count} patients…", patients.Count);
        var providersById = providers.ToDictionary(p => p.ProviderId);

        var encounters = new List<Encounter>();
        var vitals = new List<VitalReading>();
        var labs = new List<LabResult>();
        var referrals = new List<Referral>();
        var medications = new List<Medication>();
        var refills = new List<MedicationRefill>();
        var documents = new List<Document>();
        var carePlans = new List<CarePlan>();
        var carePlanGoals = new List<CarePlanGoal>();

        foreach (var patient in patients)
        {
            var rng = new Random(patient.PatientId.GetHashCode());
            Provider? pcp = patient.PrimaryCareProviderId != null && providersById.TryGetValue(patient.PrimaryCareProviderId.Value, out var p) ? p : null;
            var providerName = pcp != null ? $"{pcp.FirstName} {pcp.LastName}" : "Dr. Sample Provider";
            var departmentName = pcp?.Specialty ?? "Internal Medicine";

            encounters.AddRange(BuildEncounters(rng, patient.PatientId, providerName, departmentName));
            vitals.AddRange(BuildVitals(rng, patient.PatientId));
            labs.AddRange(BuildLabs(rng, patient.PatientId));
            referrals.AddRange(BuildReferrals(rng, patient.PatientId, providerName));

            var (meds, medRefills) = BuildMedications(rng, patient.PatientId, providerName);
            medications.AddRange(meds);
            refills.AddRange(medRefills);

            documents.AddRange(BuildDocuments(rng, patient.PatientId, providerName));

            var (plan, goals) = BuildCarePlan(patient, providerName);
            carePlans.Add(plan);
            carePlanGoals.AddRange(goals);
        }

        await BatchInsertAsync(encounters, "Encounters");
        await BatchInsertAsync(vitals, "VitalReadings");
        await BatchInsertAsync(labs, "LabResults");
        await BatchInsertAsync(referrals, "Referrals");
        await BatchInsertAsync(medications, "Medications");
        await BatchInsertAsync(refills, "MedicationRefills");
        await BatchInsertAsync(documents, "Documents");
        await BatchInsertAsync(carePlans, "CarePlans");
        await BatchInsertAsync(carePlanGoals, "CarePlanGoals");
    }

    private static List<Encounter> BuildEncounters(Random rng, Guid patientId, string providerName, string departmentName)
    {
        var encounterTypes = new[] { "Visit", "Telehealth", "Procedure", "Lab Visit" };
        var reasons = new[]
        {
            "Annual physical examination", "Follow-up for hypertension", "Routine diabetes management",
            "Persistent cough evaluation", "Medication review", "Lab result discussion",
            "Back pain consultation", "Vaccination"
        };
        var assessments = new[]
        {
            "Stable, no acute concerns", "Blood pressure well controlled",
            "A1c trending downward — continue current regimen", "Symptoms improved with current treatment",
            "Mild elevation noted; recommend lifestyle modification"
        };
        var plans = new[]
        {
            "Continue current medications; recheck in 3 months", "Increase physical activity; low-sodium diet counseling",
            "Repeat labs in 6 weeks", "Schedule follow-up in 1 month", "Refer to dietitian for diabetes education"
        };

        var encounters = new List<Encounter>();
        var count = rng.Next(6, 10);
        for (var i = 0; i < count; i++)
        {
            var daysAgo = rng.Next(7, 540);
            encounters.Add(new Encounter
            {
                EncounterId = Guid.NewGuid(),
                PatientId = patientId,
                EncounterDate = DateTime.UtcNow.AddDays(-daysAgo),
                EncounterType = encounterTypes[rng.Next(encounterTypes.Length)],
                ProviderName = providerName,
                DepartmentName = departmentName,
                Reason = reasons[rng.Next(reasons.Length)],
                Assessment = assessments[rng.Next(assessments.Length)],
                Plan = plans[rng.Next(plans.Length)],
                Status = "Completed"
            });
        }
        return encounters;
    }

    private static List<VitalReading> BuildVitals(Random rng, Guid patientId)
    {
        var readings = new List<VitalReading>();
        var now = DateTime.UtcNow;
        for (var i = 0; i < 8; i++)
        {
            var date = now.AddDays(-i * 45);
            readings.Add(new VitalReading { VitalReadingId = Guid.NewGuid(), PatientId = patientId, ReadingDate = date, Metric = "Systolic BP", Value = rng.Next(118, 145), Unit = "mmHg", ReferenceRange = "< 120", IsAbnormal = false });
            readings.Add(new VitalReading { VitalReadingId = Guid.NewGuid(), PatientId = patientId, ReadingDate = date, Metric = "Diastolic BP", Value = rng.Next(72, 92), Unit = "mmHg", ReferenceRange = "< 80", IsAbnormal = false });
            readings.Add(new VitalReading { VitalReadingId = Guid.NewGuid(), PatientId = patientId, ReadingDate = date, Metric = "Heart Rate", Value = rng.Next(62, 90), Unit = "bpm", ReferenceRange = "60–100", IsAbnormal = false });
        }
        return readings;
    }

    private static List<LabResult> BuildLabs(Random rng, Guid patientId)
    {
        var results = new List<LabResult>();
        var now = DateTime.UtcNow;
        var metabolic = new[] { "Hemoglobin A1c", "Fasting Glucose", "LDL Cholesterol", "HDL Cholesterol", "TSH", "Creatinine" };

        for (var i = 0; i < 6; i++)
        {
            var date = now.AddDays(-i * 90);
            foreach (var test in metabolic)
            {
                var isAbnormal = rng.NextDouble() < 0.3;
                results.Add(new LabResult
                {
                    LabResultId = Guid.NewGuid(),
                    PatientId = patientId,
                    CollectedDate = date,
                    TestName = test,
                    Value = test switch
                    {
                        "Hemoglobin A1c" => Math.Round(isAbnormal ? rng.NextDouble() * 1.5 + 6.5 : rng.NextDouble() * 0.7 + 5.2, 1),
                        "Fasting Glucose" => Math.Round((double)(isAbnormal ? rng.Next(110, 145) : rng.Next(78, 105)), 0),
                        "LDL Cholesterol" => Math.Round(isAbnormal ? rng.NextDouble() * 55 + 130 : rng.NextDouble() * 40 + 80, 0),
                        "HDL Cholesterol" => Math.Round(rng.NextDouble() * 25 + 40, 0),
                        "TSH" => Math.Round(isAbnormal ? rng.NextDouble() * 3.5 + 4.0 : rng.NextDouble() * 2.2 + 0.8, 2),
                        "Creatinine" => Math.Round(rng.NextDouble() * 0.6 + 0.7, 2),
                        _ => 0
                    },
                    Unit = test switch
                    {
                        "Hemoglobin A1c" => "%",
                        "Fasting Glucose" or "LDL Cholesterol" or "HDL Cholesterol" => "mg/dL",
                        "TSH" => "mIU/L",
                        "Creatinine" => "mg/dL",
                        _ => string.Empty
                    },
                    ReferenceRange = test switch
                    {
                        "Hemoglobin A1c" => "< 5.7%",
                        "Fasting Glucose" => "70–99 mg/dL",
                        "LDL Cholesterol" => "< 100 mg/dL",
                        "HDL Cholesterol" => "> 40 mg/dL",
                        "TSH" => "0.4–4.0 mIU/L",
                        "Creatinine" => "0.6–1.3 mg/dL",
                        _ => string.Empty
                    },
                    IsAbnormal = isAbnormal,
                    Category = test switch
                    {
                        "Hemoglobin A1c" or "Fasting Glucose" => "Metabolic",
                        "LDL Cholesterol" or "HDL Cholesterol" => "Lipid",
                        "TSH" => "Thyroid",
                        _ => "Renal"
                    }
                });
            }
        }
        return results;
    }

    private static List<Referral> BuildReferrals(Random rng, Guid patientId, string providerName)
    {
        return
        [
            new Referral
            {
                ReferralId = Guid.NewGuid(),
                PatientId = patientId,
                RequestedDate = DateTime.UtcNow.AddDays(-rng.Next(30, 180)),
                Specialty = "Cardiology",
                Reason = "Evaluation of elevated blood pressure readings",
                FromProvider = providerName,
                Status = "Scheduled"
            },
            new Referral
            {
                ReferralId = Guid.NewGuid(),
                PatientId = patientId,
                RequestedDate = DateTime.UtcNow.AddDays(-rng.Next(180, 365)),
                Specialty = "Dermatology",
                Reason = "Routine skin check",
                FromProvider = providerName,
                Status = "Completed"
            }
        ];
    }

    private static (List<Medication>, List<MedicationRefill>) BuildMedications(Random rng, Guid patientId, string providerName)
    {
        var activeCatalog = new[]
        {
            ("Lisinopril", "10 mg", "Once daily", "Oral"),
            ("Metformin", "500 mg", "Twice daily", "Oral"),
            ("Atorvastatin", "20 mg", "Once daily", "Oral"),
            ("Levothyroxine", "50 mcg", "Once daily", "Oral"),
            ("Amlodipine", "5 mg", "Once daily", "Oral"),
            ("Omeprazole", "20 mg", "Once daily", "Oral"),
            ("Sertraline", "50 mg", "Once daily", "Oral"),
            ("Vitamin D3", "2000 IU", "Once daily", "Oral")
        };
        var historyCatalog = new[]
        {
            ("Amoxicillin", "500 mg", "Three times daily", "Oral"),
            ("Ibuprofen", "600 mg", "As needed", "Oral"),
            ("Hydrochlorothiazide", "25 mg", "Once daily", "Oral"),
            ("Prednisone", "20 mg", "Tapered", "Oral"),
            ("Albuterol", "90 mcg", "As needed", "Inhalation")
        };
        var pharmacies = new[] { "CVS Pharmacy", "Walgreens", "Rite Aid", "Walmart Pharmacy" };
        var stopReasons = new[] { "Course completed", "Adverse reaction", "Switched therapy", "No longer needed", "Therapy effective" };
        var refillStatuses = new[] { "Filled", "Filled", "Filled", "Pending", "Denied" };

        var medications = new List<Medication>();
        var refills = new List<MedicationRefill>();

        var activeCount = rng.Next(3, 6);
        var activePicks = activeCatalog.OrderBy(_ => rng.Next()).Take(activeCount).ToList();
        foreach (var m in activePicks)
        {
            var med = new Medication
            {
                MedicationId = Guid.NewGuid(),
                PatientId = patientId,
                MedicationName = m.Item1,
                Dosage = m.Item2,
                Frequency = m.Item3,
                Route = m.Item4,
                PrescriberName = providerName,
                StartDate = DateTime.UtcNow.AddDays(-rng.Next(30, 600)),
                EndDate = null,
                StopReason = null,
                RefillsRemaining = rng.Next(0, 4),
                Pharmacy = pharmacies[rng.Next(pharmacies.Length)],
                Status = "Active"
            };
            medications.Add(med);

            var n = rng.Next(1, 3);
            for (var r = 0; r < n; r++)
            {
                refills.Add(new MedicationRefill
                {
                    MedicationRefillId = Guid.NewGuid(),
                    MedicationId = med.MedicationId,
                    PatientId = patientId,
                    MedicationName = med.MedicationName,
                    RefillDate = DateTime.UtcNow.AddDays(-rng.Next(5, 90)),
                    Status = refillStatuses[rng.Next(refillStatuses.Length)]
                });
            }
        }

        foreach (var m in historyCatalog)
        {
            medications.Add(new Medication
            {
                MedicationId = Guid.NewGuid(),
                PatientId = patientId,
                MedicationName = m.Item1,
                Dosage = m.Item2,
                Frequency = m.Item3,
                Route = m.Item4,
                PrescriberName = providerName,
                StartDate = DateTime.UtcNow.AddDays(-rng.Next(365, 900)),
                EndDate = DateTime.UtcNow.AddDays(-rng.Next(60, 300)),
                StopReason = stopReasons[rng.Next(stopReasons.Length)],
                RefillsRemaining = 0,
                Pharmacy = "CVS Pharmacy",
                Status = "Discontinued"
            });
        }

        return (medications, refills);
    }

    private static List<Document> BuildDocuments(Random rng, Guid patientId, string providerName)
    {
        return DocCatalog.Select((row, i) => new Document
        {
            DocumentId = Guid.NewGuid(),
            PatientId = patientId,
            Name = row[0],
            Type = row[0],
            UploadedDate = DateTime.UtcNow.AddDays(-rng.Next(1, 400)),
            ProviderName = providerName,
            Status = i switch { 1 or 4 => "Draft", 2 => "Pending Review", _ => "Final" },
            Url = $"/docs/{Uri.EscapeDataString(row[1])}",
            SizeBytes = 186_893,
            PageCount = 3
        }).ToList();
    }

    private static (CarePlan, List<CarePlanGoal>) BuildCarePlan(Patient patient, string providerName)
    {
        var lastUpdated = DateTime.UtcNow.AddDays(-12);
        var carePlanId = Guid.NewGuid();
        var plan = new CarePlan
        {
            CarePlanId = carePlanId,
            PatientId = patient.PatientId,
            Title = $"Care Plan — {patient.FirstName} {patient.LastName}",
            LastUpdated = lastUpdated,
            Version = CarePlanContent.Version,
            AuthorName = providerName,
            SdoContent = CarePlanContent.BuildSdo(patient, providerName, lastUpdated),
            InterventionsJson = JsonSerializer.Serialize(CarePlanContent.Interventions),
            FollowUpsJson = JsonSerializer.Serialize(CarePlanContent.FollowUps)
        };

        var goals = CarePlanContent.Goals.Select(g => new CarePlanGoal
        {
            CarePlanGoalId = Guid.NewGuid(),
            CarePlanId = carePlanId,
            Goal = g.Goal,
            Target = g.Target,
            Status = g.Status,
            ProgressPct = g.ProgressPct
        }).ToList();

        return (plan, goals);
    }

    private string PickFirstName(bool isFemale) =>
        isFemale ? FemaleFirstNames[_random.Next(FemaleFirstNames.Length)] : MaleFirstNames[_random.Next(MaleFirstNames.Length)];

    private static int DurationForSpecialty(string specialty) => specialty switch
    {
        "Cardiology" or "Neurology" => 45,
        "Orthopedics" or "Obstetrics & Gynecology" => 30,
        _ => 20
    };

    private async Task BatchInsertAsync<T>(List<T> items, string name) where T : class
    {
        const int batchSize = 2000;
        int inserted = 0;
        for (int i = 0; i < items.Count; i += batchSize)
        {
            var batch = items.Skip(i).Take(batchSize).ToList();
            try
            {
                await db.Set<T>().AddRangeAsync(batch);
                await db.SaveChangesAsync();
                inserted += batch.Count;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "{name} batch {start}..{end} failed", name, i, i + batchSize);
            }
        }
        logger.LogInformation("Seeded {Table}: {count} rows", name, inserted);
    }
}
