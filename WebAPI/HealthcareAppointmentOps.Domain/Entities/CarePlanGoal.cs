namespace HealthcareAppointmentOps.Domain.Entities;

public class CarePlanGoal
{
    public Guid CarePlanGoalId { get; set; }
    public Guid CarePlanId { get; set; }
    public string Goal { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double ProgressPct { get; set; }

    public CarePlan CarePlan { get; set; } = null!;
}
