import { Component, inject, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import {
  ChartModule,
  CategoryService,
  StackingColumnSeriesService,
  ColumnSeriesService,
  LegendService,
  TooltipService,
  DataLabelService,
  HighlightService,
  SelectionService,
} from '@syncfusion/ej2-angular-charts';
import { ListViewModule } from '@syncfusion/ej2-angular-lists';
import { HealthcareService } from '../../core/api/healthcare.service';
import {
  APPOINTMENT_TYPE_SERIES,
  BAR_RAMP,
  buildValueAxis,
  chartFillHeight,
  CHART_LEGEND_SETTINGS,
  HIDDEN_LEGEND_SETTINGS,
  COLUMN_WIDTH,
  COLUMN_CORNER_RADIUS,
  CHART_SELECTION_MODE,
  CHART_HIGHLIGHT_MODE,
  chartThemeName,
} from '../../core/utils/chart-theme';
import { ThemeService } from '../../core/theme/theme.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import {
  LucideCalendarDays,
  LucideUserCheck,
  LucideClock,
  LucideTrendingUp,
  LucideListChecks,
} from '@lucide/angular';
import type {
  AppointmentSummaryDto,
  DashboardKpiDto,
  VolumeDataPointDto,
  UtilizationDataPointDto,
} from '../../core/models/dtos';

interface StatusStyle {
  fg: string;
  bg: string;
  label: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  Scheduled: { fg: 'var(--color-sf-cyan-700)', bg: 'var(--color-sf-cyan-50)', label: 'Scheduled' },
  Confirmed: { fg: 'var(--color-sf-success-700)', bg: 'var(--color-sf-success-50)', label: 'Confirmed' },
  CheckedIn: { fg: 'var(--color-sf-brand-700)', bg: 'var(--color-sf-brand-50)', label: 'Checked In' },
  InProgress: { fg: 'var(--color-sf-warning-700)', bg: 'var(--color-sf-warning-50)', label: 'In Progress' },
  Completed: { fg: 'var(--color-sf-fg-secondary)', bg: 'var(--color-sf-bg-tertiary)', label: 'Completed' },
};

const NEUTRAL_STATUS: StatusStyle = {
  fg: 'var(--color-sf-fg-tertiary)',
  bg: 'var(--color-sf-bg-tertiary)',
  label: 'Scheduled',
};

interface VolumeRow {
  department: string;
  [type: string]: number | string;
}

interface UtilizationRow {
  name: string;
  rate: number;
  color: string;
}

interface UpcomingItem {
  appointmentId: string;
  patientName: string;
  appointmentType: string;
  providerName: string;
  initials: string;
  statusLabel: string;
  statusFg: string;
  statusBg: string;
  time: string;
  day: string;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function relativeDay(dt: Date): string {
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(dt) - startOf(today)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function volumeTotal(row: VolumeRow): number {
  return APPOINTMENT_TYPE_SERIES.reduce((sum, s) => sum + ((row[s.type] as number) ?? 0), 0);
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    ListViewModule,
    KpiCardComponent,
    LoadingStateComponent,
    ErrorBannerComponent,
    EmptyStateComponent,
    LucideCalendarDays,
    LucideUserCheck,
    LucideClock,
    LucideTrendingUp,
    LucideListChecks,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  providers: [
    CategoryService,
    StackingColumnSeriesService,
    ColumnSeriesService,
    LegendService,
    TooltipService,
    DataLabelService,
    HighlightService,
    SelectionService,
  ],
})
export class DashboardPageComponent implements OnInit {
  private healthcare = inject(HealthcareService);
  private theme = inject(ThemeService);

  readonly chartTheme = computed(() => chartThemeName(this.theme.resolved()));
  readonly chartFillHeight = chartFillHeight;

  private readonly rangeStartDate: string;
  private readonly rangeEndDate: string;
  private readonly todayFrom: string;
  private readonly todayTo: string;

  private readonly kpiState = createAsyncResult<DashboardKpiDto>(
    () => this.healthcare.getDashboardKpis().pipe(map((res) => okOrThrow(res))),
    { immediate: false }
  );

  private readonly upcomingState = createAsyncResult<AppointmentSummaryDto[]>(
    () =>
      this.healthcare
        .listAppointments({ dateFrom: this.todayFrom, dateTo: this.todayTo, limit: '200' })
        .pipe(map((res) => okOrThrow(res).items)),
    { immediate: false }
  );

  private readonly UPCOMING_STATUSES = ['Scheduled', 'Confirmed', 'CheckedIn', 'InProgress', 'Completed'];

  private readonly volumeState = createAsyncResult<VolumeDataPointDto[]>(
    () =>
      this.healthcare
        .getAppointmentVolume(this.rangeStartDate, this.rangeEndDate)
        .pipe(map((res) => okOrThrow(res))),
    { immediate: false }
  );

  private readonly utilizationState = createAsyncResult<UtilizationDataPointDto[]>(
    () =>
      this.healthcare
        .getProviderUtilization(this.rangeStartDate, this.rangeEndDate)
        .pipe(map((res) => okOrThrow(res))),
    { immediate: false }
  );

  readonly volumeData = computed<VolumeRow[]>(() => {
    const rows = this.volumeState.data ?? [];
    const byDept = new Map<string, VolumeRow>();
    rows.forEach((d) => {
      let entry = byDept.get(d.departmentName);
      if (!entry) {
        entry = { department: d.departmentName };
        APPOINTMENT_TYPE_SERIES.forEach((s) => (entry![s.type] = 0));
        byDept.set(d.departmentName, entry);
      }
      if (d.appointmentType in entry) {
        entry[d.appointmentType] = (entry[d.appointmentType] as number) + d.count;
      }
    });
    return Array.from(byDept.values()).sort((a, b) => volumeTotal(b) - volumeTotal(a));
  });

  readonly utilizationData = computed<UtilizationRow[]>(() => {
    const rows = this.utilizationState.data ?? [];
    const byProvider = new Map<string, { name: string; appts: number; slots: number }>();
    rows.forEach((d) => {
      const entry = byProvider.get(d.providerName) ?? { name: d.providerName, appts: 0, slots: 0 };
      entry.appts += d.appointmentCount;
      entry.slots += d.totalSlots;
      byProvider.set(d.providerName, entry);
    });
    return Array.from(byProvider.values())
      .map((p) => ({
        name: p.name,
        rate: p.slots > 0 ? Math.round((100 * p.appts) / p.slots) : 0,
        color: '',
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8)
      .map((d, i) => ({ ...d, color: BAR_RAMP[i % BAR_RAMP.length] }));
  });

  readonly upcomingItems = computed<UpcomingItem[]>(() => {
    const items = this.upcomingState.data ?? [];
    return items
      .filter((a) => this.UPCOMING_STATUSES.includes(a.status))
      .sort(
        (a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
      )
      .slice(0, 12)
      .map((a) => {
        const dt = new Date(a.scheduledDateTime);
        const s = STATUS_STYLES[a.status] ?? NEUTRAL_STATUS;
        return {
          appointmentId: a.appointmentId,
          patientName: a.patientName,
          appointmentType: a.appointmentType,
          providerName: a.providerName,
          initials: initialsOf(a.patientName),
          statusLabel: s.label,
          statusFg: s.fg,
          statusBg: s.bg,
          time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          day: relativeDay(dt),
        };
      });
  });

  readonly kpis = computed(() => this.kpiState.data);
  readonly kpisError = computed(() => this.kpiState.error);
  readonly volumeLoading = computed(() => this.volumeState.loading);
  readonly utilizationLoading = computed(() => this.utilizationState.loading);
  readonly upcomingLoading = computed(() => this.upcomingState.loading);

  readonly volumeError = computed(() => this.volumeState.error);
  readonly utilizationError = computed(() => this.utilizationState.error);
  readonly upcomingError = computed(() => this.upcomingState.error);
  readonly bannerError = computed(() => this.kpiState.error ?? this.upcomingState.error);

  readonly volumePrimaryXAxis = {
    valueType: 'Category',
    title: 'Department',
  };
  readonly volumePrimaryYAxis = {
    title: 'Share',
    labelFormat: '{value}%',
    minimum: 0,
    maximum: 100,
    interval: 20,
  };
  readonly utilizationPrimaryXAxis = {
    valueType: 'Category',
    title: 'Provider',
  };
  readonly utilizationPrimaryYAxis = computed(() =>
    buildValueAxis(this.utilizationData().map((d) => d.rate), {
      title: 'Utilization %',
      labelFormat: '{value}%',
    })
  );
  readonly tooltip = { enable: true };

  readonly legendSettings = CHART_LEGEND_SETTINGS;
  readonly hiddenLegend = HIDDEN_LEGEND_SETTINGS;
  readonly columnWidth = COLUMN_WIDTH;
  readonly cornerRadius = COLUMN_CORNER_RADIUS;
  readonly selectionMode = CHART_SELECTION_MODE;
  readonly highlightMode = CHART_HIGHLIGHT_MODE;

  readonly appointmentTypeSeries = APPOINTMENT_TYPE_SERIES;

  constructor() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.rangeStartDate = toYmd(start);
    this.rangeEndDate = toYmd(end);

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
    this.todayFrom = dayStart.toISOString();
    this.todayTo = dayEnd.toISOString();
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.kpiState.refresh();
    this.upcomingState.refresh();
    this.volumeState.refresh();
    this.utilizationState.refresh();
  }

  retryBanner(): void {
    this.kpiState.refresh();
    this.upcomingState.refresh();
  }

  retryVolume(): void {
    this.volumeState.refresh();
  }

  retryUtilization(): void {
    this.utilizationState.refresh();
  }

  retryUpcoming(): void {
    this.upcomingState.refresh();
  }
}
