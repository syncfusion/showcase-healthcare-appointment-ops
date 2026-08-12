import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SidebarModule } from '@syncfusion/ej2-angular-navigations';
import { DropDownListModule, ChangeEventArgs as DropDownChangeArgs } from '@syncfusion/ej2-angular-dropdowns';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import type {
  AppointmentDetailDto,
  AppointmentStatus,
  AuditLogEntryDto,
} from '../../core/models/dtos';

const STATUS_WORKFLOW: AppointmentStatus[] = [
  'Scheduled',
  'Confirmed',
  'CheckedIn',
  'InProgress',
  'Completed',
];

const TERMINAL_STATUSES: AppointmentStatus[] = ['Completed', 'Cancelled', 'NoShow'];

type ConfirmKind = 'cancel' | 'noshow' | null;

@Component({
  selector: 'app-appointment-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    SidebarModule,
    DropDownListModule,
    ButtonModule,
    DialogModule,
    TextBoxModule,
    StatusBadgeComponent,
    LoadingStateComponent,
    ErrorBannerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-detail-panel.component.html',
  styleUrl: './appointment-detail-panel.component.scss',
})
export class AppointmentDetailPanelComponent implements OnChanges {
  @Input({ required: true }) appointmentId = '';
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  private healthcare = inject(HealthcareService);

  readonly detail = signal<AppointmentDetailDto | null>(null);
  readonly audit = signal<AuditLogEntryDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly confirm = signal<ConfirmKind>(null);
  readonly cancelReason = signal('');

  readonly statusItems = computed<AppointmentStatus[]>(() => {
    const current = this.detail()?.status;
    if (!current) return [];
    const items: AppointmentStatus[] = STATUS_WORKFLOW.filter((s) => s !== current);
    if (current !== 'Cancelled') items.push('Cancelled');
    if (current !== 'NoShow') items.push('NoShow');
    return items;
  });

  readonly isTerminal = computed(() => {
    const s = this.detail()?.status;
    return !!s && TERMINAL_STATUSES.includes(s);
  });

  readonly endDate = computed(() => {
    const d = this.detail();
    if (!d) return null;
    return new Date(new Date(d.scheduledDateTime).getTime() + d.durationMinutes * 60000);
  });

  ngOnChanges(changes: SimpleChanges): void {
    const idChange = changes['appointmentId'];
    if (idChange && this.appointmentId && this.appointmentId !== idChange.previousValue) {
      this.loadDetail(this.appointmentId);
    }
  }

  loadDetail(id: string): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      detail: this.healthcare.getAppointment(id).pipe(
        map((res) => okOrThrow(res)),
        catchError(() => of(null))
      ),
      audit: this.healthcare.listAuditLog('Appointment', id, 0, 5).pipe(
        map((res) => (res.status === 'ok' ? res.data?.items ?? [] : [])),
        catchError(() => of([]))
      ),
    }).subscribe({
      next: ({ detail, audit }) => {
        if (detail) {
          this.detail.set(detail);
        } else {
          this.error.set('Failed to load appointment');
          this.detail.set(null);
        }
        this.audit.set(audit);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.error.set(e instanceof Error ? e.message : 'Failed to load appointment');
        this.loading.set(false);
      },
    });
  }

  refreshAfterChange(): void {
    if (this.appointmentId) {
      this.loadDetail(this.appointmentId);
      this.changed.emit();
    }
  }

  onStatusChange(args: DropDownChangeArgs): void {
    const next = args.value as AppointmentStatus | null;
    const d = this.detail();
    if (!next || !d) return;
    if (next === 'Cancelled') {
      this.confirm.set('cancel');
      return;
    }
    if (next === 'NoShow') {
      this.confirm.set('noshow');
      return;
    }
    this.healthcare
      .transitionAppointmentStatus(d.appointmentId, { status: next })
      .pipe(
        map((res) => okOrThrow(res)),
        catchError(() => of(null))
      )
      .subscribe({
        next: (updated) => {
          if (updated) this.detail.set(updated);
          this.refreshAfterChange();
        },
        error: () => this.error.set('Status transition failed'),
      });
  }

  handleCheckIn(): void {
    const d = this.detail();
    if (!d) return;
    this.healthcare
      .checkInAppointment(d.appointmentId, 'FrontDesk')
      .pipe(
        map((res) => okOrThrow(res)),
        catchError(() => of(null))
      )
      .subscribe({
        next: (updated) => {
          if (updated) this.detail.set(updated);
          this.refreshAfterChange();
        },
        error: () => this.error.set('Check-in failed'),
      });
  }

  runCancel(): void {
    const d = this.detail();
    if (!d) return;
    this.healthcare
      .cancelAppointment(d.appointmentId, this.cancelReason())
      .pipe(
        map((res) => okOrThrow(res)),
        catchError(() => of(null))
      )
      .subscribe({
        next: (updated) => {
          if (updated) this.detail.set(updated);
          this.confirm.set(null);
          this.cancelReason.set('');
          this.refreshAfterChange();
        },
        error: () => this.error.set('Cancel failed'),
      });
  }

  runNoShow(): void {
    const d = this.detail();
    if (!d) return;
    this.healthcare
      .noShowAppointment(d.appointmentId)
      .pipe(
        map((res) => okOrThrow(res)),
        catchError(() => of(null))
      )
      .subscribe({
        next: (updated) => {
          if (updated) this.detail.set(updated);
          this.confirm.set(null);
          this.refreshAfterChange();
        },
        error: () => this.error.set('No-Show failed'),
      });
  }

  onCancelReasonChange(value: string | undefined): void {
    this.cancelReason.set(value ?? '');
  }

  closePanel(): void {
    this.close.emit();
  }

  readonly cancelButtons = [
    {
      click: () => this.runCancel(),
      buttonModel: {
        content: 'Confirm Cancel',
        cssClass: 'e-danger',
        isPrimary: true,
      },
    },
    {
      click: () => this.confirm.set(null),
      buttonModel: { content: 'Keep Appointment', cssClass: 'e-flat' },
    },
  ];

  readonly noshowButtons = [
    {
      click: () => this.runNoShow(),
      buttonModel: {
        content: 'Confirm No-Show',
        cssClass: 'e-warning',
        isPrimary: true,
      },
    },
    {
      click: () => this.confirm.set(null),
      buttonModel: { content: 'Dismiss', cssClass: 'e-flat' },
    },
  ];
}
