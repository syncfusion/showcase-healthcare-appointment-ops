import React from 'react';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject as ChartInject,
  ColumnSeries,
  SplineSeries,
  Category,
  Legend,
  Tooltip,
} from '@syncfusion/ej2-react-charts';
import { LoadingState } from '@components/shared/LoadingState';
import { EmptyState } from '@components/shared/EmptyState';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import {
  SERIES_TEAL,
  SERIES_ROSE,
  buildValueAxis,
  chartFillHeight,
  chartInteraction,
  chartThemeName,
  COLUMN_STYLE,
  Highlight,
  Selection,
} from '../../utils/chartTheme';
import { useTheme } from '../../theme/ThemeProvider';

interface TrendPoint {
  month: string;
  rate: number;
}

export interface ProviderAnalyticsTabProps {
  utilizationData: TrendPoint[];
  utilizationLoading: boolean;
  utilizationError: string | null;
  onUtilizationRetry: () => void;
  noShowData: TrendPoint[];
  noShowLoading: boolean;
  noShowError: string | null;
  onNoShowRetry: () => void;
  departmentName: string;
}

const card: React.CSSProperties = {
  background: 'var(--color-sf-bg-primary)',
  borderRadius: 8,
  padding: 20,
  boxShadow: 'var(--shadow-default)',
};

export const ProviderAnalyticsTab: React.FC<ProviderAnalyticsTabProps> = ({
  utilizationData,
  utilizationLoading,
  utilizationError,
  onUtilizationRetry,
  noShowData,
  noShowLoading,
  noShowError,
  onNoShowRetry,
  departmentName,
}) => {
  const { resolved } = useTheme();
  const chartTheme = chartThemeName(resolved);
  return (
  <div className="responsive-collapse-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
    <div style={card}>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Utilization Trend</div>
      {utilizationLoading ? (
        <LoadingState inline label="Loading utilization…" />
      ) : utilizationError ? (
        <ErrorBanner message={utilizationError} onRetry={onUtilizationRetry} />
      ) : utilizationData.length === 0 ? (
        <EmptyState title="No utilization data" description="No appointments in the last 6 months." />
      ) : (
        <div style={{ height: chartFillHeight({ rows: 1, reserve: 420, floor: 240 }) }}>
        <ChartComponent
          theme={chartTheme}
          primaryXAxis={{ valueType: 'Category' }}
          primaryYAxis={buildValueAxis(utilizationData.map((d) => d.rate), { title: 'Utilization %', labelFormat: '{value}%' })}
          legendSettings={{ visible: false }}
          height="100%"
          tooltip={{ enable: true }}
          {...chartInteraction}
        >
          <ChartInject services={[SplineSeries, Category, Legend, Tooltip, Highlight, Selection]} />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={utilizationData}
              xName="month"
              yName="rate"
              name="Utilization %"
              type="Spline"
              fill={SERIES_TEAL}
              width={2}
              marker={{ visible: true, width: 7, height: 7 }}
            />
          </SeriesCollectionDirective>
        </ChartComponent>
        </div>
      )}
    </div>
    <div style={card}>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>No-Show Rate Trend</div>
      <div style={{ fontSize: 11, color: 'var(--color-sf-fg-quinary)', marginBottom: 12 }}>Department-level trend ({departmentName})</div>
      {noShowLoading ? (
        <LoadingState inline label="Loading no-show trend…" />
      ) : noShowError ? (
        <ErrorBanner message={noShowError} onRetry={onNoShowRetry} />
      ) : noShowData.length === 0 ? (
        <EmptyState title="No no-show data" description="No appointments in the last 6 months." />
      ) : (
        <div style={{ height: chartFillHeight({ rows: 1, reserve: 420, floor: 240 }) }}>
        <ChartComponent
          theme={chartTheme}
          primaryXAxis={{ valueType: 'Category' }}
          primaryYAxis={buildValueAxis(noShowData.map((d) => d.rate), { title: 'No-Show %', labelFormat: '{value}%' })}
          legendSettings={{ visible: false }}
          height="100%"
          tooltip={{ enable: true }}
          {...chartInteraction}
        >
          <ChartInject services={[ColumnSeries, Category, Legend, Tooltip, Highlight, Selection]} />
          <SeriesCollectionDirective>
            <SeriesDirective dataSource={noShowData} xName="month" yName="rate" name="No-Show %" type="Column" fill={SERIES_ROSE} {...COLUMN_STYLE} />
          </SeriesCollectionDirective>
        </ChartComponent>
        </div>
      )}
    </div>
  </div>
  );
};
