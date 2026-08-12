import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  ViewChild,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GridModule,
  PageService,
  SortService,
  ToolbarService,
  ExcelExportService,
  GridComponent,
} from '@syncfusion/ej2-angular-grids';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import {
  DropDownListModule,
  DropDownListComponent,
} from '@syncfusion/ej2-angular-dropdowns';
import {
  DateTimePickerModule,
  DateTimePickerComponent,
} from '@syncfusion/ej2-angular-calendars';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { DialogModule, DialogComponent } from '@syncfusion/ej2-angular-popups';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card.component';
import { map } from 'rxjs/operators';
import type {
  AppointmentSummaryDto,
  AppointmentStatus,
  ProviderSummaryDto,
  DepartmentDto,
  LocationDto,
} from '../../core/models/dtos';

const APPT_STATUSES: AppointmentStatus[] = [
  'Scheduled',
  'Confirmed',
  'CheckedIn',
  'InProgress',
  'Completed',
  'Cancelled',
  'NoShow',
];

@Component({
  selector: 'app-patient-appointments-tab',
  standalone: true,
  imports: [
    CommonModule,
    GridModule,
    ButtonModule,
    DropDownListModule,
    DateTimePickerModule,
    TextBoxModule,
    DialogModule,
    ErrorBannerComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
    KpiCardComponent,
  ],
  providers: [
    PageService,
    SortService,
    ToolbarService,
    ExcelExportService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-appointments-tab.component.html',
  styleUrl: './patient-appointments-tab.component.scss',
})
export class PatientAppointmentsTabComponent {
  private healthcare = inject(HealthcareService);

  private _patientId = signal<string>('');
  private _refreshTick = signal(0);

  @Input({ required: true })
  set patientId(value: string) {
    this._patientId.set(value);
    if (value) this.allAppointmentsState.refresh();
  }

  @ViewChild('apptGrid') apptGrid?: GridComponent;
  @ViewChild('bookDialog') bookDialog?: DialogComponent;
  @ViewChild('cancelDialog') cancelDialog?: DialogComponent;
  @ViewChild('confirmDialog') confirmDialog?: DialogComponent;
  @ViewChild('providerDropDown') providerDropDown?: DropDownListComponent;
  @ViewChild('deptDropDown') deptDropDown?: DropDownListComponent;
  @ViewChild('locationDropDown') locationDropDown?: DropDownListComponent;
  @ViewChild('typeDropDown') typeDropDown?: DropDownListComponent;
  @ViewChild('durationDropDown') durationDropDown?: DropDownListComponent;
  @ViewChild('scheduledPicker') scheduledPicker?: DateTimePickerComponent;
  @ViewChild('reasonInput') reasonInput?: any;
  @ViewChild('cancelReasonInput') cancelReasonInput?: any;

  readonly statusFilter = signal<string>('All');
  readonly statuses = ['All', ...APPT_STATUSES];

  readonly bookOpen = signal(false);
  readonly bookSubmitting = signal(false);
  readonly bookError = signal<string | null>(null);
  readonly scheduled = signal<Date>(new Date(Date.now() + 60 * 60 * 1000));
  readonly apptType = signal<string>('Consultation');
  readonly duration = signal<number>(30);
  readonly reason = signal<string>('');
  readonly providerId = signal<string>('');
  readonly departmentId = signal<string>('');
  readonly locationId = signal<string>('');

  readonly apptTypes = ['Consultation', 'Follow-up', 'Telehealth', 'Procedure', 'Lab Visit', 'Vaccination'];
  readonly durations = [15, 30, 45, 60];

  readonly cancelTarget = signal<AppointmentSummaryDto | null>(null);
  readonly confirmAction = signal<{ appt: AppointmentSummaryDto; kind: 'checkin' | 'noshow' } | null>(null);

  readonly allAppointmentsState = createAsyncResult<AppointmentSummaryDto[]>(() =>
    this.healthcare
      .getPatientAppointments(this._patientId())
      .pipe(map((res) => okOrThrow(res)))
  , { immediate: false, destroyRef: inject(DestroyRef) });

  readonly providersState = createAsyncResult<{ items: ProviderSummaryDto[]; paging: { total: number } }>(() =>
    this.healthcare.listProviders().pipe(map((res) => okOrThrow(res)))
  );

  readonly departmentsState = createAsyncResult<DepartmentDto[]>(() =>
    this.healthcare.listDepartments().pipe(map((res) => okOrThrow(res)))
  );

  readonly locationsState = createAsyncResult<LocationDto[]>(() =>
    this.healthcare.listLocations().pipe(map((res) => okOrThrow(res)))
  );

  readonly appts = computed(() => this.allAppointmentsState.data ?? []);
  readonly loading = computed(() => this.allAppointmentsState.loading);
  readonly error = computed(() => this.allAppointmentsState.error);
  readonly retryAppointments = () => this.allAppointmentsState.refresh();

  readonly metrics = computed(() => {
    const now = Date.now();
    const list = this.appts();
    const completed = list.filter((a) => a.status === 'Completed');
    const upcoming = list.filter(
      (a) =>
        (a.status === 'Scheduled' || a.status === 'Confirmed') &&
        new Date(a.scheduledDateTime).getTime() >= now
    );
    const noShows = list.filter((a) => a.status === 'NoShow');
    return {
      total: list.length,
      completedCount: completed.length,
      noShowsCount: noShows.length,
      upcomingCount: upcoming.length,
    };
  });

  readonly filteredAppts = computed(() => {
    const filter = this.statusFilter();
    const list = this.appts();
    if (filter === 'All') return list;
    return list.filter((a) => a.status === filter);
  });

  readonly providers = computed(() => this.providersState.data?.items ?? []);
  readonly departments = computed(() => this.departmentsState.data ?? []);
  readonly locations = computed(() => this.locationsState.data ?? []);

  readonly departmentOptions = computed(() =>
    this.departments().map((d) => ({
      ...d,
      displayLabel: `${d.departmentName} — ${d.locationName}`,
    }))
  );

  readonly pageSettings = { pageSize: 10 };
  readonly toolbar = ['Search'];

  readonly confirmHeader = computed(() =>
    this.confirmAction()?.kind === 'checkin' ? 'Check In' : 'Mark No-Show'
  );
  readonly confirmPrimaryText = computed(() =>
    this.confirmAction()?.kind === 'checkin' ? 'Check In' : 'Mark No-Show'
  );

  openBook(): void {
    this.bookOpen.set(true);
    this.bookError.set(null);
    this.scheduled.set(new Date(Date.now() + 60 * 60 * 1000));
    this.apptType.set('Consultation');
    this.duration.set(30);
    this.reason.set('');
    this.providerId.set('');
    this.departmentId.set('');
    this.locationId.set('');
    this.bookDialog?.show();
  }

  closeBook(): void {
    this.bookDialog?.hide();
    this.bookOpen.set(false);
  }

  onBookSubmit(): void {
    if (this.bookSubmitting()) return;
    if (!this.providerId() || !this.departmentId() || !this.locationId()) {
      this.bookError.set('Please select provider, department, and location.');
      return;
    }
    this.bookSubmitting.set(true);
    this.bookError.set(null);

    this.healthcare
      .createAppointment({
        patientId: this._patientId(),
        providerId: this.providerId(),
        departmentId: this.departmentId(),
        locationId: this.locationId(),
        appointmentType: this.apptType(),
        scheduledDateTime: this.scheduled().toISOString(),
        durationMinutes: this.duration(),
        reasonForVisit: this.reason(),
      })
      .pipe(map((res) => okOrThrow(res)))
      .subscribe({
        next: () => {
          this.bookSubmitting.set(false);
          this.closeBook();
          this.refresh();
        },
        error: (err: unknown) => {
          this.bookSubmitting.set(false);
          this.bookError.set(err instanceof Error ? err.message : 'Failed to create appointment.');
        },
      });
  }

  openCancel(appt: AppointmentSummaryDto): void {
    this.cancelTarget.set(appt);
    this.cancelDialog?.show();
  }

  closeCancel(): void {
    this.cancelDialog?.hide();
    this.cancelTarget.set(null);
  }

  runCancel(): void {
    const target = this.cancelTarget();
    if (!target) return;
    const reason = this.cancelReasonInput?.value ?? '';
    this.healthcare
      .cancelAppointment(target.appointmentId, reason)
      .pipe(map((res) => okOrThrow(res)))
      .subscribe({
        next: () => {
          this.closeCancel();
          this.refresh();
        },
        error: (err: unknown) => {
          this.closeCancel();
          window.alert(err instanceof Error ? err.message : 'Failed to cancel appointment.');
        },
      });
  }

  openConfirm(appt: AppointmentSummaryDto, kind: 'checkin' | 'noshow'): void {
    this.confirmAction.set({ appt, kind });
    this.confirmDialog?.show();
  }

  closeConfirm(): void {
    this.confirmDialog?.hide();
    this.confirmAction.set(null);
  }

  runConfirm(): void {
    const action = this.confirmAction();
    if (!action) return;
    if (action.kind === 'checkin') {
      this.healthcare
        .checkInAppointment(action.appt.appointmentId, 'kiosk')
        .pipe(map((res) => okOrThrow(res)))
        .subscribe({
          next: () => {
            this.closeConfirm();
            this.refresh();
          },
          error: (err: unknown) => {
            this.closeConfirm();
            window.alert(err instanceof Error ? err.message : 'Check-in failed.');
          },
        });
    } else {
      this.healthcare
        .noShowAppointment(action.appt.appointmentId)
        .pipe(map((res) => okOrThrow(res)))
        .subscribe({
          next: () => {
            this.closeConfirm();
            this.refresh();
          },
          error: (err: unknown) => {
            this.closeConfirm();
            window.alert(err instanceof Error ? err.message : 'No-show update failed.');
          },
        });
    }
  }

  exportExcel(): void {
    this.apptGrid?.excelExport();
  }

  refresh(): void {
    this._refreshTick.update((t) => t + 1);
    this.allAppointmentsState.refresh();
  }

  trackByApptId(_: number, appt: AppointmentSummaryDto): string {
    return appt.appointmentId;
  }

  fmtApptDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
