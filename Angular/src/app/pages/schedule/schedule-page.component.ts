import { Component, inject, computed, signal, effect, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import {
  ScheduleModule,
  EventSettingsModel,
  ActionEventArgs,
  CellClickEventArgs,
  EventClickArgs,
  NavigatingEventArgs,
  EventRenderedArgs,
  GroupModel,
} from '@syncfusion/ej2-angular-schedule';
import { DropDownListModule, ChangeEventArgs as DropDownChangeArgs } from '@syncfusion/ej2-angular-dropdowns';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { NewAppointmentDialogComponent } from './new-appointment-dialog.component';
import { AppointmentDetailPanelComponent } from './appointment-detail-panel.component';
import { getAppointmentColor, chooseTextColor } from '../../core/utils/appointment-colors';
import type {
  AppointmentSummaryDto,
  ProviderSummaryDto,
  DepartmentDto,
  CreateAppointmentRequest,
} from '../../core/models/dtos';

interface ScheduleEvent {
  Id: string;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  ProviderId: string;
  ResourceId: string;
  ProviderName: string;
  PatientName: string;
  Status: string;
  IsReadonly: boolean;
  AppointmentType: string;
  CategoryColor: string;
}

import {
  DayService,
  WeekService,
  WorkWeekService,
  MonthService,
  TimelineViewsService,
  ResizeService,
  DragAndDropService,
} from '@syncfusion/ej2-angular-schedule';

function computeVisibleRange(anchor: Date, view: string): [Date, Date] {
  if (view === 'Month') {
    const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - 7);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    end.setDate(end.getDate() + 7);
    return [start, end];
  }
  return [startOfWeek(anchor), endOfWeek(anchor)];
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  return new Date(start.getTime() + 6 * 86400000);
}

function formatDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatEndOfDay(d: Date): string {
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return end.toISOString();
}

@Component({
  selector: 'app-schedule-page',
  standalone: true,
  imports: [
    CommonModule,
    ScheduleModule,
    DropDownListModule,
    ButtonModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    NewAppointmentDialogComponent,
    AppointmentDetailPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-page.component.html',
  styleUrl: './schedule-page.component.scss',
  providers: [
    DayService,
    WeekService,
    WorkWeekService,
    MonthService,
    TimelineViewsService,
    ResizeService,
    DragAndDropService,
  ],
})
export class SchedulePageComponent {
  private healthcare = inject(HealthcareService);

  @ViewChild(NewAppointmentDialogComponent) dialog?: NewAppointmentDialogComponent;

  readonly selectedDate = signal(new Date());
  readonly currentView = signal<string>('WorkWeek');
  readonly departmentFilter = signal('');
  readonly providerFilter = signal('');
  readonly refreshTick = signal(0);
  readonly dialogVisible = signal(false);
  readonly dialogDateTime = signal<Date | undefined>(undefined);
  readonly dialogProviderId = signal<string | undefined>(undefined);
  readonly detailOpen = signal(false);
  readonly detailAppointmentId = signal<string>('');
  readonly isMobile = window.innerWidth <= 768;

  readonly departmentsState = createAsyncResult<DepartmentDto[]>(() =>
    this.healthcare.listDepartments().pipe(map((res) => okOrThrow(res)))
  );

  constructor() {
    effect(() => {
      const depts = this.departmentsState.data ?? [];
      if (!this.departmentFilter() && depts.length > 0) {
        this.departmentFilter.set(depts[0].departmentId);
        this.providersState.refresh();
        this.apptsState.refresh();
      }
    });
  }

  readonly providersState = createAsyncResult<{ items: ProviderSummaryDto[] }>(() =>
    this.healthcare
      .listProviders(this.departmentFilter() || undefined)
      .pipe(map((res) => okOrThrow(res)))
  );

  readonly apptsState = createAsyncResult<{ items: AppointmentSummaryDto[] }>(() => {
    const [rangeStart, rangeEnd] = computeVisibleRange(this.selectedDate(), this.currentView());
    const params: Record<string, string> = {
      dateFrom: formatDateOnly(rangeStart),
      dateTo: formatEndOfDay(rangeEnd),
      limit: '500',
    };
    if (this.departmentFilter()) params['departmentId'] = this.departmentFilter();
    if (this.providerFilter()) params['providerId'] = this.providerFilter();
    return this.healthcare.listAppointments(params).pipe(map((res) => okOrThrow(res)));
  });

  readonly events = computed<ScheduleEvent[]>(() => {
    const items = this.apptsState.data?.items ?? [];
    return items.map((a) => {
      const color = getAppointmentColor(a.appointmentType);
      return {
        Id: a.appointmentId,
        Subject: `${a.patientName} — ${a.appointmentType}`,
        StartTime: new Date(a.scheduledDateTime),
        EndTime: new Date(new Date(a.scheduledDateTime).getTime() + a.durationMinutes * 60000),
        ProviderId: a.providerId ?? this.providerFilter(),
        ResourceId: a.providerId ?? this.providerFilter(),
        ProviderName: a.providerName,
        PatientName: a.patientName,
        Status: a.status,
        IsReadonly: ['Completed', 'Cancelled', 'NoShow'].includes(a.status),
        AppointmentType: a.appointmentType,
        CategoryColor: color,
      };
    });
  });

  readonly eventSettings = computed<EventSettingsModel>(() => ({
    dataSource: this.events(),
    fields: {
      id: 'Id',
      subject: { name: 'Subject' },
      startTime: { name: 'StartTime' },
      endTime: { name: 'EndTime' },
    },
  } as EventSettingsModel));

  readonly filteredProviders = computed<ProviderSummaryDto[]>(() => {
    const all = this.providersState.data?.items ?? [];
    const dept = this.departmentFilter();
    return dept ? all.filter((p) => p.departmentId === dept) : all;
  });

  readonly resourceDataSource = computed(() =>
    this.filteredProviders().map((p) => ({
      text: `Dr. ${p.firstName} ${p.lastName}`,
      id: p.providerId,
    }))
  );

  readonly group = computed<GroupModel | undefined>(() => {
    if (this.providerFilter() || !this.departmentFilter() || this.resourceDataSource().length === 0) {
      return undefined;
    }
    return { byDate: true, resources: ['Providers'] };
  });

  readonly scheduleInstanceKey = computed(
    () => `${this.group() ? 'grouped' : 'flat'}|${this.resourceDataSource().map((r) => r.id).join(',')}`
  );

  readonly departmentOptions = computed(() => this.departmentsState.data ?? []);
  readonly departmentFields = { text: 'departmentName', value: 'departmentId', groupBy: 'locationName' };
  readonly providerFields = { text: 'lastName', value: 'providerId' };

  readonly dataError = computed(
    () => this.apptsState.error ?? this.providersState.error ?? this.departmentsState.error ?? null
  );

  readonly allDataReady = computed(
    () =>
      (!!this.apptsState.data || !!this.apptsState.error) &&
      (!!this.providersState.data || !!this.providersState.error) &&
      (!!this.departmentsState.data || !!this.departmentsState.error)
  );

  readonly scheduleLoading = computed(() => !this.allDataReady());

  onCellDoubleClick(args: CellClickEventArgs): void {
    args.cancel = true;
    const groupIndex = (args as unknown as { groupIndex?: number }).groupIndex;
    const resourceId =
      groupIndex !== undefined ? this.resourceDataSource()[groupIndex]?.id : undefined;
    this.openNewAppointment(args.startTime as Date, resourceId ?? (this.providerFilter() || undefined));
  }

  onEventClick(args: EventClickArgs): void {
    args.cancel = true;
    const id = (args.event as unknown as ScheduleEvent | undefined)?.Id;
    if (id) this.openDetailPanel(id);
  }

  onEventDoubleClick(args: EventClickArgs): void {
    args.cancel = true;
    const id = (args.event as unknown as ScheduleEvent | undefined)?.Id;
    if (id) this.openDetailPanel(id);
  }

  onNavigating(args: NavigatingEventArgs): void {
    if (args.action === 'date' && args.currentDate) {
      const next = new Date(args.currentDate as Date);
      if (next.getTime() === this.selectedDate().getTime()) return;
      this.selectedDate.set(next);
      this.apptsState.refresh();
    } else if (args.action === 'view' && args.currentView) {
      const nextView = args.currentView as string;
      if (nextView === this.currentView()) return;
      this.currentView.set(nextView);
      this.apptsState.refresh();
    }
  }

  onEventRendered(args: EventRenderedArgs): void {
    const data = args.data as unknown as ScheduleEvent;
    const bg = data?.CategoryColor;
    if (!bg || !args.element) return;
    const text = chooseTextColor(bg);
    args.element.style.backgroundColor = bg;
    args.element.style.color = text;
    args.element.style.borderColor = bg;
    args.element.querySelectorAll<HTMLElement>('.e-subject, .e-time, .e-date-time').forEach((node) => {
      node.style.color = 'inherit';
    });
  }

  onActionComplete(args: ActionEventArgs): void {
    if (args.requestType === 'eventCreated' && args.data && !Array.isArray(args.data)) {
      const ev = args.data as unknown as ScheduleEvent;
      this.openNewAppointment(ev.StartTime, ev.ProviderId);
    }
    if (args.requestType === 'eventChanged' || args.requestType === 'eventRemoved') {
      this.refreshTick.update((t) => t + 1);
      this.apptsState.refresh();
    }
  }

  onDepartmentChange(args: DropDownChangeArgs): void {
    this.departmentFilter.set((args.value as string) ?? '');
    this.providerFilter.set('');
    this.providersState.refresh();
    this.apptsState.refresh();
  }

  onProviderChange(args: DropDownChangeArgs): void {
    this.providerFilter.set((args.value as string) ?? '');
    this.apptsState.refresh();
  }

  openNewAppointment(initialDateTime?: Date, initialProviderId?: string): void {
    this.dialogDateTime.set(initialDateTime);
    this.dialogProviderId.set(initialProviderId ?? (this.providerFilter() || undefined));
    this.dialogVisible.set(true);
  }

  handleDialogSubmit(req: CreateAppointmentRequest): void {
    this.healthcare
      .createAppointment(req)
      .pipe(map((res) => okOrThrow(res)))
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.apptsState.refresh();
        },
        error: (e: unknown) =>
          alert(e instanceof Error ? e.message : 'Failed to book appointment'),
      });
  }

  openDetailPanel(appointmentId: string): void {
    this.detailAppointmentId.set(appointmentId);
    this.detailOpen.set(true);
  }

  closeDetailPanel(): void {
    this.detailOpen.set(false);
  }

  onDetailChanged(): void {
    this.apptsState.refresh();
  }

  refreshAll(): void {
    this.apptsState.refresh();
    this.providersState.refresh();
    this.departmentsState.refresh();
  }
}

