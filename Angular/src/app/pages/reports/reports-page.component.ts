import { Component, inject, computed, signal, effect, ChangeDetectionStrategy, ViewChild, AfterViewInit, OnDestroy, NgZone, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, of } from 'rxjs';
import {
  ChartModule,
  AccumulationChartModule,
  CategoryService,
  LineSeriesService,
  ColumnSeriesService,
  StepLineSeriesService,
  PieSeriesService,
  StackingColumnSeriesService,
  BulletChartModule,
  BulletTooltipService,
  LegendService,
  TooltipService,
  DataLabelService,
  HighlightService,
  SelectionService,
  AccumulationLegendService,
  AccumulationTooltipService,
  AccumulationDataLabelService,
} from '@syncfusion/ej2-angular-charts';
import { DateRangePickerModule } from '@syncfusion/ej2-angular-calendars';
import { DropDownListModule, DropDownListComponent } from '@syncfusion/ej2-angular-dropdowns';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import {
  APPOINTMENT_TYPE_SERIES,
  SERIES_ROSE,
  CATEGORY_RAMP,
  CHART_FONT_FAMILY,
  buildValueAxis,
  chartFillHeight,
  CHART_LEGEND_SETTINGS,
  ACCUMULATION_LEGEND_SETTINGS,
  HIDDEN_LEGEND_SETTINGS,
  COLUMN_WIDTH,
  COLUMN_CORNER_RADIUS,
  CHART_SELECTION_MODE,
  CHART_HIGHLIGHT_MODE,
  chartThemeName,
} from '../../core/utils/chart-theme';
import { ThemeService } from '../../core/theme/theme.service';
import type {
  VolumeDataPointDto,
  NoShowTrendDto,
  UtilizationDataPointDto,
  CancellationReasonDto,
  DepartmentDto,
} from '../../core/models/dtos';

interface VolumeRow {
  period: string;
  [type: string]: number | string;
}

interface NoShowRow {
  period: string;
  rate: number;
}

interface UtilizationRow {
  category: string;
  value: number;
  target: number;
  color: string;
}

interface CancellationRow extends CancellationReasonDto {
  color: string;
}

const UTILIZATION_TARGET = 85;
const RANGE_LOW = 'var(--color-sf-error-100)';
const RANGE_MID = 'var(--color-sf-warning-100)';
const RANGE_HIGH = 'var(--color-sf-success-100)';

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    AccumulationChartModule,
    BulletChartModule,
    DateRangePickerModule,
    DropDownListModule,
    ButtonModule,
    ErrorBannerComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss',
  providers: [
    CategoryService,
    LineSeriesService,
    ColumnSeriesService,
    StepLineSeriesService,
    PieSeriesService,
    StackingColumnSeriesService,
    BulletTooltipService,
    LegendService,
    TooltipService,
    DataLabelService,
    HighlightService,
    SelectionService,
    AccumulationLegendService,
    AccumulationTooltipService,
    AccumulationDataLabelService,
  ],
})
export class ReportsPageComponent implements AfterViewInit, OnDestroy {
  private healthcare = inject(HealthcareService);
  private theme = inject(ThemeService);
  private zone = inject(NgZone);

  readonly chartTheme = computed(() => chartThemeName(this.theme.resolved()));
  readonly chartFillHeight = chartFillHeight;

  readonly bulletChartFillHeight = (
    opts: { rows?: number; reserve?: number; floor?: number; cap?: number } = {},
  ): string => chartFillHeight({ rows: opts.rows ?? 2, reserve: opts.reserve ?? 300, floor: opts.floor ?? 320, cap: opts.cap ?? 980 });

  readonly bulletChartContainerHeight = signal(0);

  readonly bulletChartHeight = computed(() => {
    const h = this.bulletChartContainerHeight();
    return h ? `${Math.round(h)}px` : '100%';
  });

 
  readonly bulletChartRenderKey = computed<string[]>(() => {
    if (this.bulletChartLayoutVersion() === 0) return [];
    const categories = this.utilizationData().map((d) => d.category).join('|');
    return [`util-${this.departmentFilter()}-${categories}-${this.bulletChartContainerHeight()}`];
  });

  readonly bulletChartLayoutVersion = signal(0);

  @ViewChild('bulletChartWrap', { read: ElementRef }) bulletChartWrap?: ElementRef<HTMLElement>;

  @ViewChild('deptDropDown') deptDropDown?: DropDownListComponent;

  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly departmentFilter = signal<string>('');

  readonly filtersReady = computed(() => Boolean(this.startDate() && this.endDate() && this.departmentFilter()));

  private readonly departmentsState = createAsyncResult<DepartmentDto[]>(() =>
    this.healthcare.listDepartments().pipe(map((res) => okOrThrow(res)))
  );
  readonly departmentFields = { text: 'departmentName', value: 'departmentId', groupBy: 'locationName' };

  private readonly lastQuarterRange = (() => {
    const today = new Date();
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const startOfPrevQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1);
    const endOfPrevQuarter = new Date(startOfQuarter.getTime() - 86400000);
    return { start: startOfPrevQuarter, end: endOfPrevQuarter };
  })();

  readonly rangePresets = (() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const startOfPrevQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1);
    const endOfPrevQuarter = new Date(startOfQuarter.getTime() - 86400000);
    return [
      { label: 'Last 7 days', start: new Date(startOfDay.getTime() - 6 * 86400000), end: startOfDay },
      { label: 'Last 30 days', start: new Date(startOfDay.getTime() - 29 * 86400000), end: startOfDay },
      { label: 'This Month', start: startOfMonth, end: startOfDay },
      { label: 'Last Month', start: startOfPrevMonth, end: endOfPrevMonth },
      { label: 'QTD', start: startOfQuarter, end: startOfDay },
      { label: 'Last Quarter', start: startOfPrevQuarter, end: endOfPrevQuarter },
    ];
  })();

  readonly departmentOptions = computed(() => this.departmentsState.data ?? []);

  private readonly autoSelectDone = signal(false);

  constructor() {
    this.startDate.set(toYmd(this.lastQuarterRange.start));
    this.endDate.set(toYmd(this.lastQuarterRange.end));

    effect(() => {
      const depts = this.departmentsState.data ?? [];
      if (this.autoSelectDone()) return;
      if (!depts.length) return;
      if (this.departmentFilter()) {
        this.autoSelectDone.set(true);
        this.syncDropDownValue(this.departmentFilter());
        return;
      }
      const first = depts[0].departmentId;
      this.departmentFilter.set(first);
      this.autoSelectDone.set(true);
      this.syncDropDownValue(first);
      this.applyFilters();
    });

    effect(() => {
      const value = this.departmentFilter();
      this.syncDropDownValue(value, this.autoSelectDone());
    });
  }

  private bulletResizeObserver?: ResizeObserver;

  private computeBulletHeightPx(): number {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    const raw = (vh - 300) / 2; // rows: 2, reserve: 300 — matches bulletChartFillHeight
    return Math.round(Math.max(320, Math.min(980, raw))); // floor: 320, cap: 980
  }

  ngAfterViewInit(): void {
    const wrap = this.bulletChartWrap?.nativeElement;
    const measured = wrap?.clientHeight ?? 0;
    this.bulletChartContainerHeight.set(measured > 0 ? Math.round(measured) : this.computeBulletHeightPx());
    this.bulletChartLayoutVersion.set(1);
    if (typeof ResizeObserver !== 'undefined' && wrap) {
      this.bulletResizeObserver = new ResizeObserver((entries) => {
        const h = entries[0]?.contentRect?.height ?? 0;
        if (h && Math.abs(h - this.bulletChartContainerHeight()) > 2) {
          this.zone.run(() => {
            this.bulletChartContainerHeight.set(Math.round(h));
            this.bulletChartLayoutVersion.update((v) => v + 1);
          });
        }
      });
      this.bulletResizeObserver.observe(wrap);
    }
  }

  ngOnDestroy(): void {
    this.bulletResizeObserver?.disconnect();
  }

  private readonly volumeState = createAsyncResult<VolumeDataPointDto[] | undefined>(
    () =>
      this.filtersReady()
        ? this.healthcare
            .getAppointmentVolume(this.startDate(), this.endDate())
            .pipe(map((res) => okOrThrow(res)))
        : of(undefined),
    { immediate: false }
  );
  private readonly noShowState = createAsyncResult<NoShowTrendDto[] | undefined>(
    () =>
      this.filtersReady()
        ? this.healthcare
            .getNoShowTrends(this.startDate(), this.endDate(), this.departmentFilter() || undefined)
            .pipe(map((res) => okOrThrow(res)))
        : of(undefined),
    { immediate: false }
  );
  private readonly utilizationState = createAsyncResult<UtilizationDataPointDto[] | undefined>(
    () =>
      this.filtersReady()
        ? this.healthcare
            .getProviderUtilization(this.startDate(), this.endDate(), undefined, this.departmentFilter() || undefined)
            .pipe(map((res) => okOrThrow(res)))
        : of(undefined),
    { immediate: false }
  );
  private readonly cancellationState = createAsyncResult<CancellationReasonDto[] | undefined>(
    () =>
      this.filtersReady()
        ? this.healthcare
            .getCancellationReasons(this.startDate(), this.endDate(), this.departmentFilter() || undefined)
            .pipe(map((res) => okOrThrow(res)))
        : of(undefined),
    { immediate: false }
  );

  readonly volumeData = computed<VolumeRow[]>(() => {
    const data = this.volumeState.data ?? [];
    const grouped: Record<string, VolumeRow> = {};
    data
      .filter((d) => !this.departmentFilter() || d.departmentId === this.departmentFilter())
      .forEach((d) => {
        let row = grouped[d.period];
        if (!row) {
          row = { period: d.period };
          APPOINTMENT_TYPE_SERIES.forEach((s) => (row[s.type] = 0));
          grouped[d.period] = row;
        }
        if (d.appointmentType in row) {
          row[d.appointmentType] = (row[d.appointmentType] as number) + d.count;
        }
      });
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  });

  readonly noShowData = computed<NoShowRow[]>(() =>
    (this.noShowState.data ?? [])
      .map((d) => ({ period: d.period, rate: d.noShowRate * 100 }))
      .sort((a, b) => a.period.localeCompare(b.period))
  );

  readonly utilizationData = computed<UtilizationRow[]>(() => {
    const rows = this.utilizationState.data ?? [];
    const byProvider: Record<string, { providerName: string; appts: number; slots: number }> = {};
    rows.forEach((d) => {
      if (!byProvider[d.providerId]) byProvider[d.providerId] = { providerName: d.providerName, appts: 0, slots: 0 };
      byProvider[d.providerId].appts += d.appointmentCount;
      byProvider[d.providerId].slots += d.totalSlots;
    });
    return Object.values(byProvider)
      .map((p) => ({
        category: p.providerName.split(',')[0].trim(),
        value: p.slots ? Math.round((p.appts / p.slots) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .map((row, i) => ({
        ...row,
        target: UTILIZATION_TARGET,
        color: CATEGORY_RAMP[i % CATEGORY_RAMP.length],
      }));
  });

  readonly totalCancellations = computed(() =>
    this.cancellationData().reduce((sum, d) => sum + (d.count ?? 0), 0)
  );

  readonly cancellationData = computed<CancellationRow[]>(() =>
    (this.cancellationState.data ?? []).map((d, i) => ({
      ...d,
      color: CATEGORY_RAMP[i % CATEGORY_RAMP.length],
    }))
  );

  readonly bannerError = computed(
    () =>
      this.volumeState.error ??
      this.noShowState.error ??
      this.utilizationState.error ??
      this.cancellationState.error ??
      null
  );

  readonly volumeLoading = computed(() => this.volumeState.loading);
  readonly noShowLoading = computed(() => this.noShowState.loading);
  readonly utilizationLoading = computed(() => this.utilizationState.loading);
  readonly cancellationLoading = computed(() => this.cancellationState.loading);

  readonly categoryXAxis = { valueType: 'Category', title: 'Period' };
  readonly volumeYAxis = { title: 'Count' };
  readonly noShowYAxis = computed(() =>
    buildValueAxis(this.noShowData().map((d) => d.rate), { title: 'No-Show %', labelFormat: '{value}%' })
  );

  readonly tooltip = { enable: true };
  readonly accumulationTooltip = { enable: true };
  readonly legendSettings = CHART_LEGEND_SETTINGS;
  readonly hiddenLegend = HIDDEN_LEGEND_SETTINGS;
  readonly accumulationLegendBottom = { ...ACCUMULATION_LEGEND_SETTINGS, position: 'Bottom' as const };
  readonly cancellationDataLabel = {
    visible: true,
    name: 'reason',
    position: 'Outside' as const,
    font: { fontFamily: CHART_FONT_FAMILY, size: '12px' },
  };
  readonly cancellationCenterLabel = computed(() => ({
    text: `${this.totalCancellations()}`,
    textStyle: {
      fontFamily: CHART_FONT_FAMILY,
      size: '18px',
      fontWeight: '700',
      color: 'var(--color-sf-fg-primary)',
    },
  }));
  readonly cancellationMargin = { top: 16, bottom: 16, left: 16, right: 16 };
  readonly selectionMode = CHART_SELECTION_MODE;
  readonly highlightMode = CHART_HIGHLIGHT_MODE;

  readonly seriesRose = SERIES_ROSE;

  readonly volumeSeries = APPOINTMENT_TYPE_SERIES.map((s) => ({
    type: s.type,
    color: s.color,
    marker: { visible: true, width: 7, height: 7, fill: s.color },
  }));
  readonly columnWidth = COLUMN_WIDTH;
  readonly columnCornerRadius = COLUMN_CORNER_RADIUS;

  readonly utilizationTarget = UTILIZATION_TARGET;
  readonly utilizationBulletRanges = [
    { end: 70, color: RANGE_LOW, opacity: 0.6 },
    { end: 85, color: RANGE_MID, opacity: 0.6 },
    { end: 100, color: RANGE_HIGH, opacity: 0.6 },
  ];
  readonly utilizationBulletDataLabel = {
    enable: true,
    labelStyle: { size: '11px', fontFamily: CHART_FONT_FAMILY, fontWeight: '600', color: 'var(--color-sf-fg-secondary)' },
  };
  readonly utilizationBulletCategoryLabelStyle = {
    size: '12px',
    fontFamily: CHART_FONT_FAMILY,
    fontWeight: '600',
    color: 'var(--color-sf-fg-primary)',
  };
  readonly utilizationBulletLabelStyle = {
    size: '10px',
    fontFamily: CHART_FONT_FAMILY,
    color: 'var(--color-sf-fg-secondary)',
  };
  readonly utilizationBulletMargin = { left: 110, right: 40, top: 16, bottom: 16 };

  toDate(value: string): Date {
    return new Date(value);
  }

  private syncDropDownValue(value: string, run = true): void {
    if (!run) return;
    const ddl = this.deptDropDown;
    if (!ddl) return;
    // Defer to next change detection so the view child is bound after the
    // initial render and after dataSource updates.
    Promise.resolve().then(() => {
      const inst = this.deptDropDown;
      if (!inst) return;
      inst.value = value ?? null;
      inst.dataBind();
    });
  }

  applyFilters(): void {
    if (this.filtersReady()) {
      this.volumeState.refresh();
      this.noShowState.refresh();
      this.utilizationState.refresh();
      this.cancellationState.refresh();
    }
  }

  onRangeChange(value: { startDate?: Date | string | null; endDate?: Date | string | null } | null): void {
    this.startDate.set(value?.startDate ? toYmd(new Date(value.startDate)) : '');
    this.endDate.set(value?.endDate ? toYmd(new Date(value.endDate)) : '');
    this.applyFilters();
  }

  onDepartmentChange(value: string | null): void {
    this.departmentFilter.set(value ?? '');
    this.applyFilters();
  }

  resetFilters(): void {
    this.startDate.set('');
    this.endDate.set('');
    this.departmentFilter.set('');
    this.autoSelectDone.set(false);
    // Clear the ej2 input text immediately; the auto-select effect will run
    // again once autoSelectDone is reset and re-fire dataBind().
    const ddl = this.deptDropDown;
    if (ddl) {
      ddl.value = null;
      ddl.dataBind();
    }
  }

  retryAll(): void {
    this.volumeState.refresh();
    this.noShowState.refresh();
    this.utilizationState.refresh();
    this.cancellationState.refresh();
  }
}
