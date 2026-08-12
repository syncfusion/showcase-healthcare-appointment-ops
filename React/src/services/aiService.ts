import type { ApiResult } from '@models/api';
import type { ScheduleOptimizationDto, AppointmentAutoFillDto } from '@models/dtos';

export interface AIRequest {
  workflowId: string;
  context: Record<string, unknown>;
}

export interface AIResponse<T> {
  suggestions: T;
  confidence: number;
  explanation: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function scheduleOptimization(
  context: { providerId?: string; date?: string; departmentId?: string }
): Promise<ApiResult<ScheduleOptimizationDto>> {
  await sleep(600 + Math.floor(Math.random() * 400));

  const suggestions: ScheduleOptimizationDto['suggestions'] = [
    {
      type: 'fill',
      appointmentId: null,
      proposedStart: `${context.date ?? '2026-06-15'}T09:00:00Z`,
      proposedEnd: `${context.date ?? '2026-06-15'}T09:30:00Z`,
      providerId: context.providerId ?? 'provider-1',
      providerName: 'Dr. Sarah Chen',
      reason: 'Fill 30-min gap with waitlist patient',
      estimatedUtilizationGain: 0.12,
      estimatedNoShowReduction: 0.03,
      waitlistMatches: [
        { waitlistId: 'wl-101', patientName: 'James Wilson', fitScore: 0.92 },
        { waitlistId: 'wl-102', patientName: 'Maria Garcia', fitScore: 0.85 },
      ],
    },
    {
      type: 'fill',
      appointmentId: null,
      proposedStart: `${context.date ?? '2026-06-15'}T14:00:00Z`,
      proposedEnd: `${context.date ?? '2026-06-15'}T14:15:00Z`,
      providerId: context.providerId ?? 'provider-2',
      providerName: 'Dr. Michael Torres',
      reason: 'Fill 15-min gap between existing appointments',
      estimatedUtilizationGain: 0.08,
      estimatedNoShowReduction: 0.02,
      waitlistMatches: [
        { waitlistId: 'wl-103', patientName: 'Robert Kim', fitScore: 0.78 },
      ],
    },
  ];

  const result: ScheduleOptimizationDto = {
    suggestions,
    confidence: 0.87,
    explanation: `Found ${suggestions.length} schedule gaps on ${context.date ?? '2026-06-15'}. Filling gaps with waitlist patients could improve utilization by ${(suggestions.reduce((s, i) => s + i.estimatedUtilizationGain, 0) * 100).toFixed(0)}%.`,
  };

  return { status: 'ok', data: result };
}

export async function appointmentSuggest(
  context: { patientId: string; preferredDepartmentId?: string; reasonHint?: string }
): Promise<ApiResult<AppointmentAutoFillDto>> {
  await sleep(500 + Math.floor(Math.random() * 300));

  const result: AppointmentAutoFillDto = {
    suggestions: {
      appointmentType: 'Follow-Up',
      providerId: 'provider-1',
      proposedDateTime: '2026-06-22T10:00:00Z',
      durationMinutes: 15,
      reasonForVisit: context.reasonHint ?? 'Follow-up lab results',
    },
    confidence: 0.88,
    explanation: 'Patient typically books 15-min follow-ups with Dr. Chen every 4 weeks.',
  };

  return { status: 'ok', data: result };
}
