import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartModule,
  LineSeriesService,
  DateTimeService,
  LegendService,
  TooltipService,
} from '@syncfusion/ej2-angular-charts';
import { AccordionModule } from '@syncfusion/ej2-angular-navigations';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { CHART_FONT_FAMILY, chartFillHeight, chartThemeName } from '../../core/utils/chart-theme';
import { ThemeService } from '../../core/theme/theme.service';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { fmtDate } from '../../core/utils/date-format';
import { map } from 'rxjs/operators';
import type {
  ClinicalHistoryDto,
  EncounterDto,
} from '../../core/models/dtos';

const ENCOUNTER_TYPES = ['All', 'Visit', 'Telehealth', 'Procedure', 'Lab Visit'] as const;
type EncounterType = (typeof ENCOUNTER_TYPES)[number];

interface VitalSeries {
  name: string;
  points: { date: Date; value: number }[];
}

interface LabSeries {
  name: string;
  points: { date: Date; value: number; unit: string }[];
  marker: object;
}

@Component({
  selector: 'app-patient-clinical-history-tab',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    AccordionModule,
    ButtonModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
  ],
  providers: [
    LineSeriesService,
    DateTimeService,
    LegendService,
    TooltipService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-clinical-history-tab.component.html',
  styleUrl: './patient-clinical-history-tab.component.scss',
})
export class PatientClinicalHistoryTabComponent {
  private healthcare = inject(HealthcareService);
  private theme = inject(ThemeService);

  readonly chartTheme = computed(() => chartThemeName(this.theme.resolved()));
  readonly chartFillHeight = chartFillHeight;

  private _patientId = signal<string>('');

  @Input({ required: true })
  set patientId(value: string) {
    this._patientId.set(value);
    if (value) this.historyState.refresh();
  }

  private readonly historyState = createAsyncResult<ClinicalHistoryDto>(() =>
    this.healthcare
      .getPatientClinicalHistory(this._patientId())
      .pipe(map((res) => okOrThrow(res)))
  , { immediate: false, destroyRef: inject(DestroyRef) });

  readonly data = computed<ClinicalHistoryDto | undefined>(() => this.historyState.data);
  readonly loading = computed(() => this.historyState.loading);
  readonly error = computed(() => this.historyState.error);
  readonly retry = () => this.historyState.refresh();

  readonly typeFilter = signal<EncounterType>('All');
  readonly encounterTypes = ENCOUNTER_TYPES;

  readonly vitalSeries = computed<VitalSeries[]>(() => {
    const vitals = this.data()?.vitals ?? [];
    const byMetric = new Map<string, { date: Date; value: number }[]>();
    vitals.forEach((v) => {
      if (!byMetric.has(v.metric)) byMetric.set(v.metric, []);
      byMetric.get(v.metric)!.push({ date: new Date(v.readingDate), value: v.value });
    });
    return Array.from(byMetric.entries()).map(([name, points]) => ({
      name,
      points: [...points].reverse(),
    }));
  });

  readonly labSeries = computed<LabSeries[]>(() => {
    const labs = this.data()?.labs ?? [];
    const lipids = labs.filter((l) => l.category === 'Lipid');
    const metabolic = labs.filter(
      (l) => l.testName === 'Hemoglobin A1c' || l.testName === 'Fasting Glucose'
    );
    return [...lipids, ...metabolic].map((test) => ({
      name: `${test.testName} (${test.unit})`,
      points: [{ date: new Date(test.collectedDate), value: test.value, unit: test.unit }],
      marker: {
        visible: true,
        width: 7,
        height: 7,
        fill: test.isAbnormal
          ? 'var(--color-sf-fg-error-primary)'
          : 'var(--color-sf-fg-brand-primary)',
      },
    }));
  });

  readonly filteredEncounters = computed<EncounterDto[]>(() => {
    const data = this.data();
    if (!data) return [];
    const f = this.typeFilter();
    if (f === 'All') return data.encounters;
    return data.encounters.filter((e) => e.encounterType === f);
  });

  readonly encounterCountLabel = computed(() => {
    const data = this.data();
    if (!data) return '';
    return `${this.filteredEncounters().length} of ${data.encounters.length} records`;
  });

  readonly referralsSubtitle = computed(() => {
    const count = this.data()?.referrals.length ?? 0;
    return `${count} on record`;
  });

  readonly vitalsXAxis = { valueType: 'DateTime' as const, labelFormat: 'MMM d' };
  readonly vitalsYAxis = { labelFormat: '{value}' };
  readonly vitalsTooltip = { enable: true, format: '${series.name}: ${point.y} (${point.x})' };
  readonly labsXAxis = { valueType: 'DateTime' as const, labelFormat: 'MMM d, yy' };
  readonly labsTooltip = { enable: true, format: '${series.name}: ${point.y}${point.unit}' };
  readonly legendBottom = {
    visible: true,
    position: 'Bottom' as const,
    textStyle: { fontFamily: CHART_FONT_FAMILY },
  };
  readonly vitalMarker = { visible: true, width: 6, height: 6 };

  setTypeFilter(t: EncounterType): void {
    this.typeFilter.set(t);
  }

  accordionHeader(e: EncounterDto): string {
    return `${fmtDate(e.encounterDate)} • ${e.encounterType} • ${e.providerName}`;
  }
}
