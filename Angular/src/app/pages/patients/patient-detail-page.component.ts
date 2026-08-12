import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { TabModule } from '@syncfusion/ej2-angular-navigations';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card.component';
import { PatientTimelineComponent } from './patient-timeline.component';
import { PatientMedicationsTabComponent } from './patient-medications-tab.component';
import { PatientDocumentsTabComponent } from './patient-documents-tab.component';
import { PatientAppointmentsTabComponent } from './patient-appointments-tab.component';
import { PatientClinicalHistoryTabComponent } from './patient-clinical-history-tab.component';
import { PatientCarePlanTabComponent } from './patient-care-plan-tab.component';
import {
  LucideCalendarDays,
  LucideCheckCircle,
  LucideClock,
  LucideUserX,
  LucideMapPin,
  LucideStethoscope,
  LucideBuilding2,
  LucideHourglass,
} from '@lucide/angular';
import { fmtDate, fmtDateTime } from '../../core/utils/date-format';
import type {
  PatientDetailDto,
  AppointmentSummaryDto,
  AuditLogEntryDto,
} from '../../core/models/dtos';

type TabKey = 'overview' | 'clinical' | 'medications' | 'documents' | 'care-plan' | 'appointments';

const TAB_KEYS: TabKey[] = [
  'overview',
  'appointments',
  'clinical',
  'medications',
  'documents',
  'care-plan',
];

interface MetricsBundle {
  total: number;
  completedCount: number;
  noShowsCount: number;
  upcomingCount: number;
  lastVisit: AppointmentSummaryDto | null;
  nextVisit: AppointmentSummaryDto | null;
}

function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function fmtApptDate(iso: string): string {
  return fmtDateTime(iso);
}

function fmtRegistrationDate(value?: string | null): string {
  return fmtDate(value || null);
}

function fmtDob(value?: string | null): string {
  return fmtDate(value || null);
}

@Component({
  selector: 'app-patient-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    TabModule,
    ButtonModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
    KpiCardComponent,
    PatientTimelineComponent,
    PatientMedicationsTabComponent,
    PatientDocumentsTabComponent,
    PatientAppointmentsTabComponent,
    PatientClinicalHistoryTabComponent,
    PatientCarePlanTabComponent,
    LucideCalendarDays,
    LucideCheckCircle,
    LucideClock,
    LucideUserX,
    LucideMapPin,
    LucideStethoscope,
    LucideBuilding2,
    LucideHourglass,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-detail-page.component.html',
  styleUrl: './patient-detail-page.component.scss',
})
export class PatientDetailPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private healthcare = inject(HealthcareService);

  readonly id = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  readonly activeTab = signal<TabKey>('overview');

  private readonly patientState = createAsyncResult<PatientDetailDto>(() =>
    this.healthcare.getPatient(this.id()).pipe(map((res) => okOrThrow(res)))
  );

  private readonly appointmentsState = createAsyncResult<AppointmentSummaryDto[]>(() =>
    this.healthcare
      .getPatientAppointments(this.id())
      .pipe(map((res) => okOrThrow(res)))
  );

  private readonly auditState = createAsyncResult<{ items: AuditLogEntryDto[] }>(() =>
    this.healthcare
      .listAuditLog('Patient', this.id(), 0, 50)
      .pipe(map((res) => okOrThrow(res)))
  );

  readonly patient = computed(() => this.patientState.data);
  readonly loading = computed(() => this.patientState.loading);
  readonly error = computed(() => this.patientState.error);
  readonly age = computed(() => calcAge(this.patient()?.dateOfBirth));
  readonly appts = computed(() => this.appointmentsState.data ?? []);
  readonly auditEntries = computed(() => this.auditState.data?.items ?? []);

  readonly metrics = computed<MetricsBundle>(() => {
    const now = Date.now();
    const list = this.appts();
    const completed = list.filter((a) => a.status === 'Completed');
    const upcoming = list.filter(
      (a) =>
        (a.status === 'Scheduled' || a.status === 'Confirmed') &&
        new Date(a.scheduledDateTime).getTime() >= now
    );
    const noShows = list.filter((a) => a.status === 'NoShow');
    const lastVisit = completed.length
      ? completed.reduce((max, a) =>
          new Date(a.scheduledDateTime) > new Date(max.scheduledDateTime) ? a : max
        )
      : null;
    const nextVisit = upcoming.length
      ? upcoming.reduce((min, a) =>
          new Date(a.scheduledDateTime) < new Date(min.scheduledDateTime) ? a : min
        )
      : null;
    return {
      total: list.length,
      completedCount: completed.length,
      noShowsCount: noShows.length,
      upcomingCount: upcoming.length,
      lastVisit,
      nextVisit,
    };
  });

  readonly selectedTabIndex = computed(() => TAB_KEYS.indexOf(this.activeTab()));
  readonly tabHeaders = [
    { text: 'Overview' },
    { text: 'Appointments' },
    { text: 'Clinical History' },
    { text: 'Medications' },
    { text: 'Documents' },
    { text: 'Care Plan' },
  ];

  onTabSelecting(args: { selectingIndex: number }): void {
    const key = TAB_KEYS[args.selectingIndex];
    if (key) this.activeTab.set(key);
  }

  navigateToPcp(id: string | null | undefined): void {
    if (!id) return;
    this.router.navigate(['/providers', id]);
  }

  retryPatient(): void {
    this.patientState.refresh();
  }

  fmtAppt(iso: string): string {
    return fmtApptDate(iso);
  }

  fmtDob(value?: string | null): string {
    return fmtDate(value || null);
  }

  fmtRegistrationDate(value?: string | null): string {
    return fmtDate(value || null);
  }
}
