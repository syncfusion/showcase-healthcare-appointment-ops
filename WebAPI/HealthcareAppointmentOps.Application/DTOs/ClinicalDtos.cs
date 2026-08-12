namespace HealthcareAppointmentOps.Application.DTOs;

// ─────────────────────────────────────────────────────────────────────────────
// Read-only seeded demo data (Phase 2 showcase expansion)
// ─────────────────────────────────────────────────────────────────────────────

public class ClinicalHistoryDto
{
    public Guid PatientId { get; set; }
    public List<EncounterDto> Encounters { get; set; } = [];
    public List<VitalReadingDto> Vitals { get; set; } = [];
    public List<LabResultDto> Labs { get; set; } = [];
    public List<ReferralDto> Referrals { get; set; } = [];
}

public class EncounterDto
{
    public Guid EncounterId { get; set; }
    public DateTime EncounterDate { get; set; }
    public string EncounterType { get; set; } = string.Empty; // Visit, Telehealth, Procedure, Lab Visit
    public string ProviderName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Assessment { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Completed, Active
}

public class VitalReadingDto
{
    public DateTime ReadingDate { get; set; }
    public string Metric { get; set; } = string.Empty; // Systolic BP, Diastolic BP, Heart Rate, Weight, Temperature
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? ReferenceRange { get; set; }
    public bool IsAbnormal { get; set; }
}

public class LabResultDto
{
    public Guid LabResultId { get; set; }
    public DateTime CollectedDate { get; set; }
    public string TestName { get; set; } = string.Empty; // Hemoglobin A1c, Glucose, LDL Cholesterol, TSH
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string ReferenceRange { get; set; } = string.Empty;
    public bool IsAbnormal { get; set; }
    public string Category { get; set; } = string.Empty; // Metabolic, Lipid, Thyroid, Hematology
}

public class ReferralDto
{
    public Guid ReferralId { get; set; }
    public DateTime RequestedDate { get; set; }
    public string Specialty { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string FromProvider { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Open, Scheduled, Completed, Expired
}

// ─────────────────────────────────────────────────────────────────────────────
// Medications — read-only seeded demo data (Phase 2 showcase expansion)
// ─────────────────────────────────────────────────────────────────────────────

public class MedicationHistoryDto
{
    public Guid PatientId { get; set; }
    public List<MedicationDto> Active { get; set; } = [];
    public List<MedicationDto> History { get; set; } = [];
    public double AdherencePct { get; set; }
    public List<MedicationRefillDto> RecentRefills { get; set; } = [];
}

public class MedicationDto
{
    public Guid MedicationId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty; // Oral, Topical, Injection, Inhalation
    public string PrescriberName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? StopReason { get; set; }
    public int RefillsRemaining { get; set; }
    public string Pharmacy { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Active, Discontinued, On Hold
}

public class MedicationRefillDto
{
    public Guid MedicationId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public DateTime RefillDate { get; set; }
    public string Status { get; set; } = string.Empty; // Filled, Pending, Denied
}
