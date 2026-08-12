import type { ApiResult, PagingInfo } from '@models/api';
import { getJson, postJson, patchJson, deleteJson, apiBaseUrl } from './apiClient';
import type {
  PatientSummaryDto,
  PatientDetailDto,
  CreateAppointmentRequest,
  AppointmentSummaryDto,
  AppointmentDetailDto,
  StatusTransitionRequest,
  ConflictDto,
  ProviderSummaryDto,
  ProviderDetailDto,
  ScheduleTemplateDto,
  SlotDto,
  WaitlistEntryDto,
  DashboardKpiDto,
  UtilizationDataPointDto,
  NoShowTrendDto,
  VolumeDataPointDto,
  CancellationReasonDto,
  DepartmentDto,
  LocationDto,
  ScheduleOptimizationDto,
  AppointmentAutoFillDto,
  AuditLogEntryDto,
  ClinicalHistoryDto,
  MedicationHistoryDto,
  DocumentDto,
  CarePlanDto,
  LabSummaryResultDto,
  CarePlanDraftResultDto,
} from '@models/dtos';

// Patients
export async function listPatients(query?: string, offset = 0, limit = 50): Promise<ApiResult<{ items: PatientSummaryDto[]; paging: PagingInfo }>> {
  const q = query ? `&q=${encodeURIComponent(query)}` : '';
  return getJson(`/api/v1/patients?offset=${offset}&limit=${limit}${q}`);
}

export async function getPatient(id: string): Promise<ApiResult<PatientDetailDto>> {
  return getJson(`/api/v1/patients/${id}`);
}

export async function getPatientAppointments(id: string): Promise<ApiResult<AppointmentSummaryDto[]>> {
  return getJson(`/api/v1/patients/${id}/appointments`);
}

// Clinical Operations
export async function getPatientClinicalHistory(id: string): Promise<ApiResult<ClinicalHistoryDto>> {
  return getJson(`/api/v1/patients/${id}/clinical-history`);
}

export async function getPatientMedications(id: string): Promise<ApiResult<MedicationHistoryDto>> {
  return getJson(`/api/v1/patients/${id}/medications`);
}

// Document Center + Care Plan
export async function getPatientDocuments(id: string): Promise<ApiResult<DocumentDto[]>> {
  return getJson(`/api/v1/patients/${id}/documents`);
}

export function getPatientDocumentPdfUrl(patientId: string, documentId: string): string {
  return `${apiBaseUrl}/api/v1/patients/${patientId}/documents/${documentId}/pdf`;
}

export async function getPatientCarePlan(id: string): Promise<ApiResult<CarePlanDto>> {
  return getJson(`/api/v1/patients/${id}/care-plan`);
}

export async function summarizeDocument(patientId: string, documentId: string): Promise<ApiResult<LabSummaryResultDto>> {
  return postJson(`/api/v1/ai/patient/${patientId}/summarize-doc`, { documentId });
}

export async function draftCarePlan(patientId: string): Promise<ApiResult<CarePlanDraftResultDto>> {
  return postJson(`/api/v1/ai/patient/${patientId}/draft-care-plan`);
}

// Providers
export async function listProviders(departmentId?: string, specialty?: string, offset = 0, limit = 50): Promise<ApiResult<{ items: ProviderSummaryDto[]; paging: PagingInfo }>> {
  const dept = departmentId ? `&departmentId=${departmentId}` : '';
  const spec = specialty ? `&specialty=${encodeURIComponent(specialty)}` : '';
  return getJson(`/api/v1/providers?offset=${offset}&limit=${limit}${dept}${spec}`);
}

export async function getProvider(id: string): Promise<ApiResult<ProviderDetailDto>> {
  return getJson(`/api/v1/providers/${id}`);
}

export async function getProviderAvailability(id: string, date: string): Promise<ApiResult<SlotDto[]>> {
  return getJson(`/api/v1/providers/${id}/availability?date=${date}`);
}

export async function getProviderTemplates(id: string): Promise<ApiResult<ScheduleTemplateDto[]>> {
  return getJson(`/api/v1/providers/${id}/templates`);
}

// Appointments
export async function listAppointments(filters?: Record<string, string>): Promise<ApiResult<{ items: AppointmentSummaryDto[]; paging: PagingInfo }>> {
  const params = new URLSearchParams({ offset: '0', limit: '50', ...filters });
  return getJson(`/api/v1/appointments?${params.toString()}`);
}

export async function getAppointment(id: string): Promise<ApiResult<AppointmentDetailDto>> {
  return getJson(`/api/v1/appointments/${id}`);
}

export async function createAppointment(body: CreateAppointmentRequest): Promise<ApiResult<AppointmentDetailDto>> {
  return postJson('/api/v1/appointments', body);
}

export async function transitionAppointmentStatus(id: string, body: StatusTransitionRequest): Promise<ApiResult<AppointmentDetailDto>> {
  return patchJson(`/api/v1/appointments/${id}/status`, body);
}

export async function cancelAppointment(id: string, reason?: string): Promise<ApiResult<AppointmentDetailDto>> {
  return postJson(`/api/v1/appointments/${id}/cancel`, { cancellationReason: reason });
}

export async function checkInAppointment(id: string, source?: string): Promise<ApiResult<AppointmentDetailDto>> {
  return postJson(`/api/v1/appointments/${id}/checkin`, { checkInSource: source });
}

export async function noShowAppointment(id: string): Promise<ApiResult<AppointmentDetailDto>> {
  return postJson(`/api/v1/appointments/${id}/noshow`, {});
}

export async function getAppointmentConflicts(providerId: string, scheduledDateTime: string, durationMinutes: number, excludeAppointmentId?: string): Promise<ApiResult<ConflictDto[]>> {
  const ex = excludeAppointmentId ? `&excludeAppointmentId=${excludeAppointmentId}` : '';
  return getJson(`/api/v1/appointments/conflicts?providerId=${providerId}&scheduledDateTime=${encodeURIComponent(scheduledDateTime)}&durationMinutes=${durationMinutes}${ex}`);
}

// Waitlist
export async function listWaitlist(status?: string, departmentId?: string, offset = 0, limit = 50): Promise<ApiResult<{ items: WaitlistEntryDto[]; paging: PagingInfo }>> {
  const st = status ? `&status=${status}` : '';
  const dept = departmentId ? `&departmentId=${departmentId}` : '';
  return getJson(`/api/v1/waitlist?offset=${offset}&limit=${limit}${st}${dept}`);
}

export async function matchWaitlistEntry(id: string, appointmentId: string): Promise<ApiResult<WaitlistEntryDto>> {
  return postJson(`/api/v1/waitlist/${id}/match`, { appointmentId });
}

export async function removeWaitlistEntry(id: string): Promise<ApiResult<boolean>> {
  return deleteJson(`/api/v1/waitlist/${id}`);
}

// Analytics
export async function getDashboardKpis(period?: string): Promise<ApiResult<DashboardKpiDto>> {
  const q = period ? `?period=${encodeURIComponent(period)}` : '';
  return getJson(`/api/v1/analytics/dashboard${q}`);
}

export async function getProviderUtilization(startDate: string, endDate: string, providerId?: string, departmentId?: string): Promise<ApiResult<UtilizationDataPointDto[]>> {
  const p = providerId ? `&providerId=${providerId}` : '';
  const d = departmentId ? `&departmentId=${departmentId}` : '';
  return getJson(`/api/v1/analytics/provider-utilization?startDate=${startDate}&endDate=${endDate}${p}${d}`);
}

export async function getNoShowTrends(startDate: string, endDate: string, departmentId?: string): Promise<ApiResult<NoShowTrendDto[]>> {
  const d = departmentId ? `&departmentId=${departmentId}` : '';
  return getJson(`/api/v1/analytics/no-show-trends?startDate=${startDate}&endDate=${endDate}${d}`);
}

export async function getAppointmentVolume(startDate: string, endDate: string): Promise<ApiResult<VolumeDataPointDto[]>> {
  return getJson(`/api/v1/analytics/appointment-volume?startDate=${startDate}&endDate=${endDate}`);
}

export async function getCancellationReasons(startDate: string, endDate: string, departmentId?: string): Promise<ApiResult<CancellationReasonDto[]>> {
  const d = departmentId ? `&departmentId=${departmentId}` : '';
  return getJson(`/api/v1/analytics/cancellation-reasons?startDate=${startDate}&endDate=${endDate}${d}`);
}

// Reference data
export async function listDepartments(): Promise<ApiResult<DepartmentDto[]>> {
  return getJson('/api/v1/departments');
}

export async function listLocations(): Promise<ApiResult<LocationDto[]>> {
  return getJson('/api/v1/locations');
}

// Audit log
export async function listAuditLog(entityType?: string, entityId?: string, offset = 0, limit = 50): Promise<ApiResult<{ items: AuditLogEntryDto[]; paging: PagingInfo }>> {
  const et = entityType ? `&entityType=${entityType}` : '';
  const eid = entityId ? `&entityId=${entityId}` : '';
  return getJson(`/api/v1/audit-log?offset=${offset}&limit=${limit}${et}${eid}`);
}

// AI
export async function scheduleOptimization(context: { providerId?: string; date?: string; departmentId?: string }): Promise<ApiResult<ScheduleOptimizationDto>> {
  return postJson('/api/v1/ai/schedule-optimization', context);
}

export async function appointmentSuggest(context: { patientId: string; preferredDepartmentId?: string; reasonHint?: string }): Promise<ApiResult<AppointmentAutoFillDto>> {
  return postJson('/api/v1/ai/appointment-suggest', context);
}
