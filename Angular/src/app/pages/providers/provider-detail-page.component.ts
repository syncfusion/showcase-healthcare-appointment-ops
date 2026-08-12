import {
  Component,
  inject,
  computed,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map, of } from 'rxjs';
import { TabModule } from '@syncfusion/ej2-angular-navigations';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card.component';
import { ProviderScheduleTabComponent } from './provider-schedule-tab.component';
import { ProviderAnalyticsTabComponent } from './provider-analytics-tab.component';
import {
  LucideCalendarDays,
  LucideUsers,
  LucideActivity,
  LucideXCircle,
  LucideUserX,
} from '@lucide/angular';
import type {
  ProviderDetailDto,
  UtilizationDataPointDto,
  NoShowTrendDto,
  AppointmentSummaryDto,
} from '../../core/models/dtos';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(period: string): string {
  const m = Number(period.split('-')[1]);
  return MONTHS[m - 1] ?? period;
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}



interface TrendPoint {
  month: string;
  rate: number;
}

type TabKey = 'schedule' | 'analytics';
const TAB_KEYS: TabKey[] = ['schedule', 'analytics'];

@Component({
  selector: 'app-provider-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    TabModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    KpiCardComponent,
    ProviderScheduleTabComponent,
    ProviderAnalyticsTabComponent,
    LucideCalendarDays,
    LucideUsers,
    LucideActivity,
    LucideXCircle,
    LucideUserX,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './provider-detail-page.component.html',
  styleUrl: './provider-detail-page.component.scss',
})
export class ProviderDetailPageComponent {
  private route = inject(ActivatedRoute);
  private healthcare = inject(HealthcareService);

  readonly id = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  readonly activeTab = signal<TabKey>('schedule');

  readonly today = new Date();

  readonly range = computed<{ start: string; end: string }>(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    return { start: toYmd(start), end: toYmd(end) };
  });

  readonly apptWindow = computed<{ from: string; to: string }>(() => {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 14);
    return { from: toYmd(from), to: toYmd(to) };
  });

  private readonly providerState = createAsyncResult<ProviderDetailDto>(() =>
    this.healthcare.getProvider(this.id()).pipe(map((res) => okOrThrow(res)))
  );

  readonly apptsState = createAsyncResult<{ items: AppointmentSummaryDto[] }>(() =>
    this.healthcare
      .listAppointments({
        providerId: this.id(),
        dateFrom: this.apptWindow().from,
        dateTo: this.apptWindow().to,
        limit: '500',
      })
      .pipe(map((res) => okOrThrow(res)))
  );

  readonly utilizationState = createAsyncResult<UtilizationDataPointDto[]>(() =>
    this.healthcare
      .getProviderUtilization(this.range().start, this.range().end, this.id())
      .pipe(map((res) => okOrThrow(res)))
  );

  readonly noShowState = createAsyncResult<NoShowTrendDto[]>(() => {
    const provider = this.providerState.data;
    if (!provider) {
      return of([]);
    }
    return this.healthcare
      .getNoShowTrends(this.range().start, this.range().end, provider.departmentId)
      .pipe(map((res) => okOrThrow(res)));
  });

  readonly provider = computed(() => this.providerState.data);
  readonly appointments = computed<AppointmentSummaryDto[]>(() => this.apptsState.data?.items ?? []);

  readonly utilizationData = computed<TrendPoint[]>(() => {
    const rows = this.utilizationState.data ?? [];
    const byMonth = new Map<string, { key: string; appts: number; slots: number }>();
    rows.forEach((r) => {
      const key = r.date.slice(0, 7);
      const e = byMonth.get(key) ?? { key, appts: 0, slots: 0 };
      e.appts += r.appointmentCount;
      e.slots += r.totalSlots;
      byMonth.set(key, e);
    });
    return Array.from(byMonth.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((e) => ({ month: monthLabel(e.key), rate: e.slots > 0 ? Math.round((100 * e.appts) / e.slots) : 0 }));
  });

  readonly overallUtilization = computed<number | null>(() => {
    const rows = this.utilizationState.data ?? [];
    const appts = rows.reduce((s, r) => s + r.appointmentCount, 0);
    const slots = rows.reduce((s, r) => s + r.totalSlots, 0);
    return slots > 0 ? Math.round((100 * appts) / slots) : null;
  });

  readonly noShowData = computed<TrendPoint[]>(() => {
    const rows = this.noShowState.data ?? [];
    return [...rows]
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((r) => ({ month: monthLabel(r.period), rate: Math.round(r.noShowRate * 1000) / 10 }));
  });

  readonly kpis = computed(() => {
    const startWeek = startOfWeek(this.today).getTime();
    const endWeek = startWeek + 7 * 86400000;
    const todayYmd = toYmd(this.today);
    let apptsToday = 0;
    let cancelled = 0;
    let noShow = 0;
    const weekPatients = new Set<string>();
    this.appointments().forEach((a) => {
      const t = new Date(a.scheduledDateTime).getTime();
      if (toYmd(new Date(a.scheduledDateTime)) === todayYmd) apptsToday += 1;
      if (t >= startWeek && t < endWeek) weekPatients.add(a.patientId);
      if (a.status === 'Cancelled') cancelled += 1;
      if (a.status === 'NoShow') noShow += 1;
    });
    const total = this.appointments().length;
    return {
      apptsToday,
      patientsThisWeek: weekPatients.size,
      cancellationRate: total > 0 ? (100 * cancelled) / total : null,
      noShowRate: total > 0 ? (100 * noShow) / total : null,
    };
  });

  readonly overallUtilizationLabel = computed(() =>
    this.overallUtilization() === null ? '—' : `${this.overallUtilization()}%`
  );
  readonly cancellationRateLabel = computed(() => this.pct(this.kpis().cancellationRate));
  readonly noShowRateLabel = computed(() => this.pct(this.kpis().noShowRate));

  readonly loadingProvider = computed(() => this.providerState.loading);
  readonly providerError = computed(() => this.providerState.error);

  constructor() {
    effect(() => {
      if (this.providerState.data) this.noShowState.refresh();
    });
  }

  readonly selectedTabIndex = computed(() => TAB_KEYS.indexOf(this.activeTab()));
  readonly tabHeaders = [
    { text: 'Schedule' },
    { text: 'Analytics' },
  ];

  private pct(v: number | null): string {
    return v === null ? '—' : `${v.toFixed(1)}%`;
  }

  onTabSelecting(args: { selectingIndex: number }): void {
    const key = TAB_KEYS[args.selectingIndex];
    if (key) this.activeTab.set(key);
  }

  retryProvider(): void {
    this.providerState.refresh();
  }

  retryAppointments = (): void => {
    this.apptsState.refresh();
  };

  retryUtilization = (): void => {
    this.utilizationState.refresh();
  };

  retryNoShow = (): void => {
    this.noShowState.refresh();
  };
}
