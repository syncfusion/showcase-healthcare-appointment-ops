import { Component, Input, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartModule,
  CategoryService,
  ColumnSeriesService,
  SplineSeriesService,
  LegendService,
  TooltipService,
  HighlightService,
  SelectionService,
} from '@syncfusion/ej2-angular-charts';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import {
  SERIES_TEAL,
  SERIES_ROSE,
  buildValueAxis,
  chartFillHeight,
  HIDDEN_LEGEND_SETTINGS,
  COLUMN_WIDTH,
  COLUMN_CORNER_RADIUS,
  CHART_SELECTION_MODE,
  CHART_HIGHLIGHT_MODE,
  chartThemeName,
} from '../../core/utils/chart-theme';
import { ThemeService } from '../../core/theme/theme.service';

interface TrendPoint {
  month: string;
  rate: number;
}

@Component({
  selector: 'app-provider-analytics-tab',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorBannerComponent,
  ],
  providers: [
    CategoryService,
    ColumnSeriesService,
    SplineSeriesService,
    LegendService,
    TooltipService,
    HighlightService,
    SelectionService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './provider-analytics-tab.component.html',
  styleUrl: './provider-analytics-tab.component.scss',
})
export class ProviderAnalyticsTabComponent {
  private theme = inject(ThemeService);

  readonly chartTheme = computed(() => chartThemeName(this.theme.resolved()));
  readonly chartFillHeight = chartFillHeight;

  @Input({ required: true }) utilizationData: TrendPoint[] = [];
  @Input() utilizationLoading = false;
  @Input() utilizationError: string | null = null;
  @Input() onUtilizationRetry: () => void = () => {};

  @Input({ required: true }) noShowData: TrendPoint[] = [];
  @Input() noShowLoading = false;
  @Input() noShowError: string | null = null;
  @Input() onNoShowRetry: () => void = () => {};

  @Input() departmentName = '';

  readonly categoryXAxis = { valueType: 'Category' as const };
  get utilizationYAxis() {
    return buildValueAxis(this.utilizationData.map((d) => d.rate), {
      title: 'Utilization %',
      labelFormat: '{value}%',
    });
  }
  get noShowYAxis() {
    return buildValueAxis(this.noShowData.map((d) => d.rate), {
      title: 'No-Show %',
      labelFormat: '{value}%',
    });
  }
  readonly tooltip = { enable: true };
  readonly hiddenLegend = HIDDEN_LEGEND_SETTINGS;
  readonly columnWidth = COLUMN_WIDTH;
  readonly cornerRadius = COLUMN_CORNER_RADIUS;
  readonly selectionMode = CHART_SELECTION_MODE;
  readonly highlightMode = CHART_HIGHLIGHT_MODE;
  readonly seriesTeal = SERIES_TEAL;
  readonly seriesRose = SERIES_ROSE;

  retryUtilization(): void {
    this.onUtilizationRetry();
  }

  retryNoShow(): void {
    this.onNoShowRetry();
  }
}
