import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import type { ApiResult, PagingInfo } from '../models/api';
import type {
  PatientSummaryDto,
  PatientDetailDto,
  ProviderSummaryDto,
  ProviderDetailDto,
  ScheduleTemplateDto,
  SlotDto,
  AppointmentSummaryDto,
  AppointmentDetailDto,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  StatusTransitionRequest,
  WaitlistEntryDto,
  DashboardKpiDto,
  UtilizationDataPointDto,
  NoShowTrendDto,
  VolumeDataPointDto,
  CancellationReasonDto,
  DepartmentDto,
  LocationDto,
  AuditLogEntryDto,
  ScheduleOptimizationDto,
  AppointmentAutoFillDto,
  ClinicalHistoryDto,
  MedicationHistoryDto,
  DocumentDto,
  CarePlanDto,
  LabSummaryResultDto,
  CarePlanDraftResultDto,
  ConflictDto,
} from '../models/dtos';

@Injectable({ providedIn: 'root' })
export class HealthcareService {
  constructor(private readonly api: ApiService) {}

  // Patients
  listPatients(query?: string, offset = 0, limit = 50): Observable<ApiResult<{ items: PatientSummaryDto[]; paging: PagingInfo }>> {
    const params: Record<string, string> = { offset: String(offset), limit: String(limit) };
    if (query) params['q'] = query;
    return this.api.getJson('/api/v1/patients', params);
  }

  getPatient(id: string): Observable<ApiResult<PatientDetailDto>> {
    return this.api.getJson(`/api/v1/patients/${id}`);
  }

  getPatientAppointments(id: string): Observable<ApiResult<AppointmentSummaryDto[]>> {
    return this.api.getJson(`/api/v1/patients/${id}/appointments`);
  }

  getPatientClinicalHistory(id: string): Observable<ApiResult<ClinicalHistoryDto>> {
    return this.api.getJson(`/api/v1/patients/${id}/clinical-history`);
  }

  getPatientMedications(id: string): Observable<ApiResult<MedicationHistoryDto>> {
    return this.api.getJson(`/api/v1/patients/${id}/medications`);
  }

  getPatientDocuments(id: string): Observable<ApiResult<DocumentDto[]>> {
    return this.api.getJson(`/api/v1/patients/${id}/documents`);
  }

  getPatientDocumentPdfUrl(patientId: string, documentId: string): string {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    return `${base}/api/v1/patients/${patientId}/documents/${documentId}/pdf`;
  }

  getPatientCarePlan(id: string): Observable<ApiResult<CarePlanDto>> {
    return this.api.getJson(`/api/v1/patients/${id}/care-plan`);
  }

  summarizeDocument(patientId: string, documentId: string): Observable<ApiResult<LabSummaryResultDto>> {
    return this.api.postJson(`/api/v1/ai/patient/${patientId}/summarize-doc`, { documentId });
  }

  draftCarePlan(patientId: string): Observable<ApiResult<CarePlanDraftResultDto>> {
    return this.api.postJson(`/api/v1/ai/patient/${patientId}/draft-care-plan`, {});
  }

  // Providers
  listProviders(departmentId?: string, specialty?: string, offset = 0, limit = 50): Observable<ApiResult<{ items: ProviderSummaryDto[]; paging: PagingInfo }>> {
    const dept = departmentId ? `&departmentId=${departmentId}` : '';
    const spec = specialty ? `&specialty=${encodeURIComponent(specialty)}` : '';
    return this.api.getJson(`/api/v1/providers?offset=${offset}&limit=${limit}${dept}${spec}`);
  }

  getProvider(id: string): Observable<ApiResult<ProviderDetailDto>> {
    return this.api.getJson(`/api/v1/providers/${id}`);
  }

  getProviderAvailability(id: string, date: string): Observable<ApiResult<SlotDto[]>> {
    return this.api.getJson(`/api/v1/providers/${id}/availability?date=${date}`);
  }

  getProviderTemplates(id: string): Observable<ApiResult<ScheduleTemplateDto[]>> {
    return this.api.getJson(`/api/v1/providers/${id}/templates`);
  }

  // Appointments
  listAppointments(filters?: Record<string, string>): Observable<ApiResult<{ items: AppointmentSummaryDto[]; paging: PagingInfo }>> {
    const params = new URLSearchParams({ offset: '0', limit: '50', ...filters });
    return this.api.getJson(`/api/v1/appointments?${params.toString()}`);
  }

  getAppointment(id: string): Observable<ApiResult<AppointmentDetailDto>> {
    return this.api.getJson(`/api/v1/appointments/${id}`);
  }

  createAppointment(body: CreateAppointmentRequest): Observable<ApiResult<AppointmentDetailDto>> {
    return this.api.postJson('/api/v1/appointments', body);
  }

  updateAppointment(id: string, body: UpdateAppointmentRequest): Observable<ApiResult<AppointmentDetailDto>> {
    return this.api.putJson(`/api/v1/appointments/${id}`, body);
  }

  transitionAppointmentStatus(id: string, body: StatusTransitionRequest): Observable<ApiResult<AppointmentDetailDto>> {
    return this.api.patchJson(`/api/v1/appointments/${id}/status`, body);
  }

  cancelAppointment(id: string, reason?: string): Observable<ApiResult<AppointmentDetailDto>> {
    return this.api.postJson(`/api/v1/appointments/${id}/cancel`, { cancellationReason: reason });
  }

  checkInAppointment(id: string, source?: string): Observable<ApiResult<AppointmentDetailDto>> {
    return this.api.postJson(`/api/v1/appointments/${id}/checkin`, { checkInSource: source });
  }

  noShowAppointment(id: string): Observable<ApiResult<AppointmentDetailDto>> {
    return this.api.postJson(`/api/v1/appointments/${id}/noshow`, {});
  }

  getAppointmentConflicts(providerId: string, scheduledDateTime: string, durationMinutes: number, excludeAppointmentId?: string): Observable<ApiResult<ConflictDto[]>> {
    const ex = excludeAppointmentId ? `&excludeAppointmentId=${excludeAppointmentId}` : '';
    return this.api.getJson(`/api/v1/appointments/conflicts?providerId=${providerId}&scheduledDateTime=${encodeURIComponent(scheduledDateTime)}&durationMinutes=${durationMinutes}${ex}`);
  }

  // Waitlist
  listWaitlist(status?: string, departmentId?: string, offset = 0, limit = 50): Observable<ApiResult<{ items: WaitlistEntryDto[]; paging: PagingInfo }>> {
    const st = status ? `&status=${status}` : '';
    const dept = departmentId ? `&departmentId=${departmentId}` : '';
    return this.api.getJson(`/api/v1/waitlist?offset=${offset}&limit=${limit}${st}${dept}`);
  }

  matchWaitlistEntry(id: string, appointmentId: string): Observable<ApiResult<WaitlistEntryDto>> {
    return this.api.postJson(`/api/v1/waitlist/${id}/match`, { appointmentId });
  }

  removeWaitlistEntry(id: string): Observable<ApiResult<boolean>> {
    return this.api.deleteJson(`/api/v1/waitlist/${id}`);
  }

  // Analytics
  getDashboardKpis(period?: string): Observable<ApiResult<DashboardKpiDto>> {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.api.getJson(`/api/v1/analytics/dashboard${q}`);
  }

  getProviderUtilization(startDate: string, endDate: string, providerId?: string, departmentId?: string): Observable<ApiResult<UtilizationDataPointDto[]>> {
    const p = providerId ? `&providerId=${providerId}` : '';
    const d = departmentId ? `&departmentId=${departmentId}` : '';
    return this.api.getJson(`/api/v1/analytics/provider-utilization?startDate=${startDate}&endDate=${endDate}${p}${d}`);
  }

  getNoShowTrends(startDate: string, endDate: string, departmentId?: string): Observable<ApiResult<NoShowTrendDto[]>> {
    const d = departmentId ? `&departmentId=${departmentId}` : '';
    return this.api.getJson(`/api/v1/analytics/no-show-trends?startDate=${startDate}&endDate=${endDate}${d}`);
  }

  getAppointmentVolume(startDate: string, endDate: string): Observable<ApiResult<VolumeDataPointDto[]>> {
    return this.api.getJson(`/api/v1/analytics/appointment-volume?startDate=${startDate}&endDate=${endDate}`);
  }

  getCancellationReasons(startDate: string, endDate: string, departmentId?: string): Observable<ApiResult<CancellationReasonDto[]>> {
    const d = departmentId ? `&departmentId=${departmentId}` : '';
    return this.api.getJson(`/api/v1/analytics/cancellation-reasons?startDate=${startDate}&endDate=${endDate}${d}`);
  }

  // Reference data
  listDepartments(): Observable<ApiResult<DepartmentDto[]>> {
    return this.api.getJson('/api/v1/departments');
  }

  listLocations(): Observable<ApiResult<LocationDto[]>> {
    return this.api.getJson('/api/v1/locations');
  }

  // Audit log
  listAuditLog(entityType?: string, entityId?: string, offset = 0, limit = 50): Observable<ApiResult<{ items: AuditLogEntryDto[]; paging: PagingInfo }>> {
    const et = entityType ? `&entityType=${entityType}` : '';
    const eid = entityId ? `&entityId=${entityId}` : '';
    return this.api.getJson(`/api/v1/audit-log?offset=${offset}&limit=${limit}${et}${eid}`);
  }

  // AI
  scheduleOptimization(context: { providerId?: string; date?: string; departmentId?: string }): Observable<ApiResult<ScheduleOptimizationDto>> {
    return this.api.postJson('/api/v1/ai/schedule-optimization', context);
  }

  appointmentSuggest(context: { patientId: string; preferredDepartmentId?: string; reasonHint?: string }): Observable<ApiResult<AppointmentAutoFillDto>> {
    return this.api.postJson('/api/v1/ai/appointment-suggest', context);
  }
}
