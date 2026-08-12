using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;

namespace HealthcareAppointmentOps.Application.Services;

/// <summary>
/// Reads a patient's persisted clinical history (encounters, vitals, labs, referrals) from the
/// database. The sample data itself is generated and persisted by the data seeder; patients without
/// seeded clinical data return empty collections.
/// </summary>
public class ClinicalHistoryService : IClinicalHistoryService
{
    private readonly IPatientRepository _patientRepo;
    private readonly IClinicalHistoryRepository _clinicalRepo;

    public ClinicalHistoryService(IPatientRepository patientRepo, IClinicalHistoryRepository clinicalRepo)
    {
        _patientRepo = patientRepo;
        _clinicalRepo = clinicalRepo;
    }

    public async Task<ApiResult<ClinicalHistoryDto>> GetForPatientAsync(Guid patientId, CancellationToken ct = default)
    {
        var patient = await _patientRepo.GetByIdAsync(patientId, ct);
        if (patient == null)
            return ApiResult<ClinicalHistoryDto>.Failure("Patient not found", $"No patient found for ID {patientId}", "NotFound");

        var encounters = await _clinicalRepo.GetEncountersAsync(patientId, ct);
        var vitals = await _clinicalRepo.GetVitalsAsync(patientId, ct);
        var labs = await _clinicalRepo.GetLabsAsync(patientId, ct);
        var referrals = await _clinicalRepo.GetReferralsAsync(patientId, ct);

        var dto = new ClinicalHistoryDto
        {
            PatientId = patientId,
            Encounters = encounters.Select(e => new EncounterDto
            {
                EncounterId = e.EncounterId,
                EncounterDate = e.EncounterDate,
                EncounterType = e.EncounterType,
                ProviderName = e.ProviderName,
                DepartmentName = e.DepartmentName,
                Reason = e.Reason,
                Assessment = e.Assessment,
                Plan = e.Plan,
                Status = e.Status
            }).ToList(),
            Vitals = vitals.Select(v => new VitalReadingDto
            {
                ReadingDate = v.ReadingDate,
                Metric = v.Metric,
                Value = v.Value,
                Unit = v.Unit,
                ReferenceRange = v.ReferenceRange,
                IsAbnormal = v.IsAbnormal
            }).ToList(),
            Labs = labs.Select(l => new LabResultDto
            {
                LabResultId = l.LabResultId,
                CollectedDate = l.CollectedDate,
                TestName = l.TestName,
                Value = l.Value,
                Unit = l.Unit,
                ReferenceRange = l.ReferenceRange,
                IsAbnormal = l.IsAbnormal,
                Category = l.Category
            }).ToList(),
            Referrals = referrals.Select(r => new ReferralDto
            {
                ReferralId = r.ReferralId,
                RequestedDate = r.RequestedDate,
                Specialty = r.Specialty,
                Reason = r.Reason,
                FromProvider = r.FromProvider,
                Status = r.Status
            }).ToList()
        };

        return ApiResult<ClinicalHistoryDto>.Success(dto);
    }
}
