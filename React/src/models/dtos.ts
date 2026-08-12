
export interface PatientSummaryDto {
  patientId: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  primaryCareProviderName: string;
  isActive: boolean;
  
  nextAppointmentDateTime: string | null;
  nextAppointmentType: string | null;
  nextAppointmentStatus: string | null;
}

export interface PatientDetailDto {
  patientId: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  preferredLanguage: string;
  primaryCareProviderId: string | null;
  primaryCareProviderName: string;
  insuranceType: string;
  registrationDate: string;
  isActive: boolean;
  communicationPreferences: {
    sms: boolean;
    email: boolean;
    phone: boolean;
    portal: boolean;
  };
  hasProxyAccess: boolean;
}

export interface ProviderSummaryDto {
  providerId: string;
  npiNumber: string;
  firstName: string;
  lastName: string;
  specialty: string;
  title: string;
  email: string;
  phoneNumber: string;
  departmentId: string;
  departmentName: string;
  locationId: string;
  locationName: string;
  isActive: boolean;
  averageAppointmentDuration: number;
}

export interface ProviderDetailDto extends ProviderSummaryDto {
}

export interface ScheduleTemplateDto {
  templateId: string;
  providerId: string;
  departmentId: string;
  locationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface SlotDto {
  slotStart: string;
  slotEnd: string;
  providerId: string;
  providerName: string;
  isAvailable: boolean;
  locationId: string;
}

export interface AppointmentSummaryDto {
  appointmentId: string;
  patientName: string;
  patientMrn: string;
  providerName: string;
  providerSpecialty: string;
  departmentName: string;
  locationName: string;
  appointmentType: string;
  status: AppointmentStatus;
  patientId: string;
  providerId: string;
  departmentId: string;
  locationId: string;
  scheduledDateTime: string;
  durationMinutes: number;
  roomNumber: string | null;
  checkInSource: string | null;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'CheckedIn'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow';

export interface AppointmentDetailDto extends AppointmentSummaryDto {
  patientId: string;
  providerId: string;
  departmentId: string;
  locationId: string;
  reasonForVisit: string;
  notes: string;
  patientInstructions: string;
  cancellationReason: string | null;
  createdDateTime: string;
  checkedInDateTime: string | null;
  completedDateTime: string | null;
}

export interface CreateAppointmentRequest {
  patientId: string;
  providerId: string;
  departmentId: string;
  locationId: string;
  appointmentType: string;
  scheduledDateTime: string;
  durationMinutes: number;
  reasonForVisit: string;
  notes?: string;
  patientInstructions?: string;
}

export interface UpdateAppointmentRequest extends CreateAppointmentRequest {
  appointmentId: string;
}

export interface StatusTransitionRequest {
  status: AppointmentStatus;
}

export interface WaitlistEntryDto {
  waitlistId: string;
  patientId: string;
  patientName: string;
  preferredProviderId: string | null;
  preferredProviderName: string | null;
  preferredDepartmentId: string;
  preferredDepartmentName: string;
  preferredLocationName: string;
  preferredDateRangeStart: string;
  preferredDateRangeEnd: string;
  priorityScore: number;
  urgencyLevel: 'Routine' | 'Urgent' | 'Emergency';
  requestedAppointmentType: string;
  requestDateTime: string;
  status: 'Open' | 'Matched' | 'ClosedExpired' | 'ClosedCancelled';
  matchedAppointmentId: string | null;
}

export interface CreateWaitlistRequest {
  patientId: string;
  preferredProviderId?: string;
  preferredDepartmentId: string;
  preferredDateRangeStart: string;
  preferredDateRangeEnd: string;
  urgencyLevel: 'Routine' | 'Urgent' | 'Emergency';
  requestedAppointmentType: string;
}

export interface DashboardKpiDto {
  period: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  noShowRate: number;
  averageUtilization: number;
  averageWaitTimeMinutes: number;
  openWaitlistCount: number;
}

export interface UtilizationDataPointDto {
  date: string;
  providerId: string;
  providerName: string;
  utilizationRate: number;
  appointmentCount: number;
  totalSlots: number;
}

export interface NoShowTrendDto {
  period: string;
  departmentId: string;
  departmentName: string;
  noShowRate: number;
  totalAppointments: number;
}

export interface VolumeDataPointDto {
  period: string;
  departmentId: string;
  departmentName: string;
  appointmentType: string;
  count: number;
}

export interface CancellationReasonDto {
  reason: string;
  count: number;
}

export interface DepartmentDto {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  locationId: string;
  locationName: string;
  isActive: boolean;
}

export interface LocationDto {
  locationId: string;
  locationName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
  timeZone: string;
  isActive: boolean;
}

export interface ConflictDto {
  appointmentId: string;
  providerId: string;
  scheduledDateTime: string;
  durationMinutes: number;
  reason: string;
}

export interface ScheduleOptimizationMatchDto {
  waitlistId: string;
  patientName: string;
  fitScore: number;
}

export interface ScheduleOptimizationSuggestionDto {
  type: 'fill' | 'shift' | 'extend';
  appointmentId: string | null;
  proposedStart: string;
  proposedEnd: string;
  providerId: string;
  providerName: string;
  reason: string;
  estimatedUtilizationGain: number;
  estimatedNoShowReduction: number;
  waitlistMatches: ScheduleOptimizationMatchDto[];
}

export interface ScheduleOptimizationDto {
  suggestions: ScheduleOptimizationSuggestionDto[];
  confidence: number;
  explanation: string;
}

export interface AppointmentAutoFillDto {
  suggestions: {
    appointmentType: string;
    providerId: string;
    proposedDateTime: string;
    durationMinutes: number;
    reasonForVisit: string;
  };
  confidence: number;
  explanation: string;
}

export interface AuditLogEntryDto {
  auditId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  ipAddress: string;
  details: Record<string, unknown>;
}





export interface EncounterDto {
  encounterId: string;
  encounterDate: string;
  encounterType: string;
  providerName: string;
  departmentName: string;
  reason: string;
  assessment: string;
  plan: string;
  status: string;
}

export interface VitalReadingDto {
  readingDate: string;
  metric: string;
  value: number;
  unit: string;
  referenceRange: string | null;
  isAbnormal: boolean;
}

export interface LabResultDto {
  labResultId: string;
  collectedDate: string;
  testName: string;
  value: number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  category: string;
}

export interface ReferralDto {
  referralId: string;
  requestedDate: string;
  specialty: string;
  reason: string;
  fromProvider: string;
  status: string;
}

export interface ClinicalHistoryDto {
  patientId: string;
  encounters: EncounterDto[];
  vitals: VitalReadingDto[];
  labs: LabResultDto[];
  referrals: ReferralDto[];
}

export interface MedicationDto {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  prescriberName: string;
  startDate: string;
  endDate: string | null;
  stopReason: string | null;
  refillsRemaining: number;
  pharmacy: string;
  status: string;
}

export interface MedicationRefillDto {
  medicationId: string;
  medicationName: string;
  refillDate: string;
  status: string;
}

export interface MedicationHistoryDto {
  patientId: string;
  active: MedicationDto[];
  history: MedicationDto[];
  adherencePct: number;
  recentRefills: MedicationRefillDto[];
}





export interface DocumentDto {
  documentId: string;
  patientId: string;
  name: string;
  type: string;
  uploadedDate: string;
  providerName: string;
  status: string;
  url: string;
  sizeBytes: number;
  pageCount: number;
}

export interface CarePlanGoalDto {
  goal: string;
  target: string;
  status: string;
  progressPct: number;
}

export interface CarePlanDto {
  patientId: string;
  title: string;
  lastUpdated: string;
  version: string;
  authorName: string;
  sdoContent: string;
  goals: CarePlanGoalDto[];
  interventions: string[];
  followUps: string[];
}

export interface LabSummaryRecommendationDto {
  title: string;
  rationale: string;
  severity: string;
}

export interface LabSummaryResultDto {
  summary: string;
  recommendations: LabSummaryRecommendationDto[];
  confidence: number;
  explanation: string;
}

export interface CarePlanDraftResultDto {
  sdoContent: string;
  confidence: number;
  explanation: string;
  generatedSections: string[];
}
