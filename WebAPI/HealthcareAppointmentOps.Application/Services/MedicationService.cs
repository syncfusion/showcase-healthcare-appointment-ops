using HealthcareAppointmentOps.Application.Abstractions;
using HealthcareAppointmentOps.Application.DTOs;
using HealthcareAppointmentOps.Application.Responses;

namespace HealthcareAppointmentOps.Application.Services;

/// <summary>
/// Reads a patient's persisted medications and refills from the database. Adherence is derived from
/// the persisted refill history (filled ÷ total). Sample data is created by the seeder.
/// </summary>
public class MedicationService : IMedicationService
{
    private readonly IPatientRepository _patientRepo;
    private readonly IMedicationRepository _medicationRepo;

    public MedicationService(IPatientRepository patientRepo, IMedicationRepository medicationRepo)
    {
        _patientRepo = patientRepo;
        _medicationRepo = medicationRepo;
    }

    public async Task<ApiResult<MedicationHistoryDto>> GetForPatientAsync(Guid patientId, CancellationToken ct = default)
    {
        var patient = await _patientRepo.GetByIdAsync(patientId, ct);
        if (patient == null)
            return ApiResult<MedicationHistoryDto>.Failure("Patient not found", $"No patient found for ID {patientId}", "NotFound");

        var medications = await _medicationRepo.GetByPatientIdAsync(patientId, ct);
        var refills = await _medicationRepo.GetRefillsByPatientIdAsync(patientId, ct);

        var active = medications.Where(m => m.Status == "Active").Select(Map).ToList();
        var history = medications.Where(m => m.Status != "Active").Select(Map).ToList();

        // Adherence derived from real refill history: proportion of refills that were filled.
        var adherencePct = refills.Count > 0
            ? Math.Round(100.0 * refills.Count(r => r.Status == "Filled") / refills.Count, 1)
            : 0;

        var dto = new MedicationHistoryDto
        {
            PatientId = patientId,
            Active = active,
            History = history,
            AdherencePct = adherencePct,
            RecentRefills = refills.Select(r => new MedicationRefillDto
            {
                MedicationId = r.MedicationId,
                MedicationName = r.MedicationName,
                RefillDate = r.RefillDate,
                Status = r.Status
            }).ToList()
        };

        return ApiResult<MedicationHistoryDto>.Success(dto);
    }

    private static MedicationDto Map(Domain.Entities.Medication m) => new()
    {
        MedicationId = m.MedicationId,
        MedicationName = m.MedicationName,
        Dosage = m.Dosage,
        Frequency = m.Frequency,
        Route = m.Route,
        PrescriberName = m.PrescriberName,
        StartDate = m.StartDate,
        EndDate = m.EndDate,
        StopReason = m.StopReason,
        RefillsRemaining = m.RefillsRemaining,
        Pharmacy = m.Pharmacy,
        Status = m.Status
    };
}
