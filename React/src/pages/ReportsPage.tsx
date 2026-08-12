import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  LineSeries,
  Category,
  Legend,
  Tooltip,
  DataLabel,
  StepLineSeries,
  PieSeries,
  BulletChartComponent,
  BulletRangeCollectionDirective,
  BulletRangeDirective,
  BulletTooltip,
  AccumulationChartComponent,
  AccumulationSeriesCollectionDirective,
  AccumulationSeriesDirective,
  AccumulationLegend,
  AccumulationTooltip,
  AccumulationDataLabel,
} from '@syncfusion/ej2-react-charts';
import { DateRangePickerComponent, ChangeEventArgs as DateRangeChangeArgs } from '@syncfusion/ej2-react-calendars';
import { DropDownListComponent, ChangeEventArgs as DropDownChangeArgs } from '@syncfusion/ej2-react-dropdowns';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { useDebounce } from '@hooks/useDebounce';
import { getAppointmentVolume, getNoShowTrends, getProviderUtilization, getCancellationReasons, listDepartments } from '@services/healthcare.service';
import { withDepartmentLabel } from '../utils/department';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import {
  APPOINTMENT_TYPE_SERIES,
  SERIES_ROSE,
  CATEGORY_RAMP,
  CHART_FONT_FAMILY,
  buildValueAxis,
  chartFillHeight,
  chartLegendSettings,
  accumulationLegendSettings,
  chartInteraction,
  chartThemeName,
  COLUMN_STYLE,
  Highlight,
  Selection,
} from '../utils/chartTheme';
import { useTheme } from '../theme/ThemeProvider';

const UTILIZATION_TARGET = 85;
const RANGE_LOW = 'var(--color-sf-error-100)';
const RANGE_MID = 'var(--color-sf-warning-100)';
const RANGE_HIGH = 'var(--color-sf-success-100)';

export const ReportsPage: React.FC = () => {
  const { resolved } = useTheme();
  const chartTheme = chartThemeName(resolved);
  const toYmd = (d: Date): string => d.toISOString().split('T')[0];
  const [lastQuarterStart, lastQuarterEnd] = useMemo(() => {
    const today = new Date();
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const startOfPrevQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1);
    const endOfPrevQuarter = new Date(startOfQuarter.getTime() - 86400000);
    return [startOfPrevQuarter, endOfPrevQuarter];
  }, []);
  const [startDate, setStartDate] = useState<string>(toYmd(lastQuarterStart));
  const [endDate, setEndDate] = useState<string>(toYmd(lastQuarterEnd));
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const deptDdlRef = useRef<DropDownListComponent>(null);

  const filtersReady = Boolean(startDate && endDate && departmentFilter);

  const utilChartRef = useRef<HTMLDivElement>(null);
  const [utilHeightRaw, setUtilHeightRaw] = useState(0);
  const utilHeight = useDebounce(utilHeightRaw, 150);
  useEffect(() => {
    const el = utilChartRef.current;
    if (!el) return;
    const update = () => setUtilHeightRaw(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [filtersReady]);

  const rangePresets = useMemo(() => {
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
      { label: 'MTD', start: startOfMonth, end: startOfDay },
      { label: 'QTD', start: startOfQuarter, end: startOfDay },
      { label: 'This Month', start: startOfMonth, end: startOfDay },
      { label: 'Last Month', start: startOfPrevMonth, end: endOfPrevMonth },
      { label: 'Last Quarter', start: startOfPrevQuarter, end: endOfPrevQuarter },
    ];
  }, []);

  const departmentsQuery = useAsyncResult(() => listDepartments(), []);
  const departmentList = departmentsQuery.data?.data ?? [];
  const firstDepartmentId = departmentList[0]?.departmentId ?? '';
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (!didAutoSelect.current && firstDepartmentId && !departmentFilter) {
      didAutoSelect.current = true;
      setDepartmentFilter(firstDepartmentId);
      const ddl = deptDdlRef.current;
      if (ddl) {
        ddl.value = firstDepartmentId;
        ddl.dataBind();
      }
    }
  }, [firstDepartmentId, departmentFilter]);
  const volumeQuery = useAsyncResult(() => getAppointmentVolume(startDate, endDate), [startDate, endDate, departmentFilter], { immediate: filtersReady });
  const noShowQuery = useAsyncResult(() => getNoShowTrends(startDate, endDate, departmentFilter || undefined), [startDate, endDate, departmentFilter], { immediate: filtersReady });
  const utilizationQuery = useAsyncResult(() => getProviderUtilization(startDate, endDate, undefined, departmentFilter || undefined), [startDate, endDate, departmentFilter], { immediate: filtersReady });
  const cancellationQuery = useAsyncResult(() => getCancellationReasons(startDate, endDate, departmentFilter || undefined), [startDate, endDate, departmentFilter], { immediate: filtersReady });

  const volumeData = useMemo(() => {
    const data = volumeQuery.data?.data ?? [];
    type VolumeRow = { period: string } & Record<string, number | string>;
    const grouped: Record<string, VolumeRow> = {};
    data
      .filter((d) => !departmentFilter || d.departmentId === departmentFilter)
      .forEach((d) => {
        let row = grouped[d.period];
        if (!row) {
          row = { period: d.period };
          APPOINTMENT_TYPE_SERIES.forEach((s) => (row[s.type] = 0));
          grouped[d.period] = row;
        }
        if (d.appointmentType in row) row[d.appointmentType] = (row[d.appointmentType] as number) + d.count;
      });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }, [volumeQuery.data, departmentFilter]);

  const noShowData = useMemo(() => {
    const data = noShowQuery.data?.data ?? [];
    const grouped: Record<string, { period: string; rate: number }> = {};
    data.forEach((d) => {
      grouped[d.period] = { period: d.period, rate: d.noShowRate * 100 };
    });
    
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }, [noShowQuery.data]);

  const utilizationData = useMemo(() => {
    const rows = utilizationQuery.data?.data ?? [];
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
  }, [utilizationQuery.data]);

  const cancellationData = useMemo(
    () => (cancellationQuery.data?.data ?? []).map((d, i) => ({ ...d, color: CATEGORY_RAMP[i % CATEGORY_RAMP.length] })),
    [cancellationQuery.data]
  );

  const totalCancellations = useMemo(
    () => cancellationData.reduce((sum, d) => sum + (d.count ?? 0), 0),
    [cancellationData]
  );

  const cardSurface: React.CSSProperties = {
    background: 'var(--color-sf-bg-primary)',
    borderRadius: 'var(--radius-12)',
    border: '1px solid var(--color-sf-border-secondary)',
    boxShadow: 'var(--shadow-sm)',
    padding: 20,
  };
  const sectionTitle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--color-sf-fg-primary)',
    marginBottom: 16,
  };

  return (
    <div>
      {(volumeQuery.error || noShowQuery.error || utilizationQuery.error || cancellationQuery.error) && (
        <ErrorBanner message="Failed to load analytics data" onRetry={() => { volumeQuery.refresh(); noShowQuery.refresh(); utilizationQuery.refresh(); cancellationQuery.refresh(); }} />
      )}

      <div className="responsive-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div id="filters" style={{ gridColumn: 'span 4', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', ...cardSurface }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 280 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-sf-fg-secondary)' }}>Date Range</label>
            <DateRangePickerComponent
              placeholder="Select a date range"
              startDate={startDate ? new Date(startDate) : undefined}
              endDate={endDate ? new Date(endDate) : undefined}
              format="MM/dd/yyyy"
              width="280px"
              showClearButton
              presets={rangePresets}
              change={(e: DateRangeChangeArgs) => {
                const [s, en] = (e.value as unknown as (Date | null)[]) ?? [];
                setStartDate(s ? toYmd(new Date(s)) : '');
                setEndDate(en ? toYmd(new Date(en)) : '');
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 220 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-sf-fg-secondary)' }}>Department</label>
            <DropDownListComponent
              ref={deptDdlRef}
              cssClass="dept-group-ddl"
              dataSource={withDepartmentLabel(departmentsQuery.data?.data ?? []) as any}
              fields={{ text: 'departmentName', value: 'departmentId', groupBy: 'locationName' }}
              placeholder="All Departments"
              change={(e: DropDownChangeArgs) => setDepartmentFilter((e.value as string) ?? '')}
              value={departmentFilter}
              allowFiltering
              showClearButton
              width="220px"
              sortOrder='Ascending'
            />
          </div>
          <ButtonComponent cssClass="e-outline" onClick={() => { setStartDate(''); setEndDate(''); setDepartmentFilter(''); }}>
            Reset
          </ButtonComponent>
        </div>

        {!filtersReady ? (
          <div style={{ gridColumn: 'span 4', ...cardSurface }}>
            <EmptyState title="Select filters" description="Choose a start date, end date, and department to view the analytics reports. Use Reset to clear your selection." />
          </div>
        ) : (
        <>
        <div id="volume" style={{ gridColumn: 'span 2', minWidth: 0, ...cardSurface }}>
          <div style={sectionTitle}>Appointment Volume Trend</div>
          <div style={{ height: chartFillHeight({ rows: 2, reserve: 300 }) }}>
          <ChartComponent theme={chartTheme} primaryXAxis={{ valueType: 'Category', title: 'Period' }} primaryYAxis={{ title: 'Count' }} legendSettings={chartLegendSettings} height="100%" tooltip={{ enable: true }}>
            <Inject services={[LineSeries, Category, Legend, Tooltip, DataLabel]} />
            <SeriesCollectionDirective>
              {APPOINTMENT_TYPE_SERIES.map((s) => (
                <SeriesDirective
                  key={s.type}
                  dataSource={volumeData}
                  xName="period"
                  yName={s.type}
                  name={s.type}
                  type="Line"
                  fill={s.color}
                  width={2}
                  marker={{ visible: true, width: 7, height: 7, fill: s.color }}
                />
              ))}
            </SeriesCollectionDirective>
          </ChartComponent>
          </div>
        </div>

        <div id="noshow" style={{ gridColumn: 'span 2', minWidth: 0, ...cardSurface }}>
          <div style={sectionTitle}>No-Show Rate Trend</div>
          <div style={{ height: chartFillHeight({ rows: 2, reserve: 300 }) }}>
          <ChartComponent
            theme={chartTheme}
            primaryXAxis={{ valueType: 'Category', title: 'Period' }}
            primaryYAxis={buildValueAxis(noShowData.map((d) => d.rate), { title: 'No-Show %', labelFormat: '{value}%' })}
            legendSettings={{ visible: false }}
            height="100%"
            tooltip={{ enable: true }}
            {...chartInteraction}
          >
            <Inject services={[StepLineSeries, Category, Legend, Tooltip, DataLabel, Highlight, Selection]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={noShowData}
                xName="period"
                yName="rate"
                name="No-Show %"
                type="StepLine"
                fill={SERIES_ROSE}
                width={2.5}
                marker={{ visible: true, width: 7, height: 7, fill: SERIES_ROSE, shape: 'Circle' }}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
          </div>
        </div>

        <div id="utilization" style={{ gridColumn: 'span 2', minWidth: 0, ...cardSurface }}>
          <div style={sectionTitle}>{`Provider Utilization (% vs ${UTILIZATION_TARGET}% goal)`}</div>
          <div ref={utilChartRef} style={{ height: chartFillHeight({ rows: 2, reserve: 300 }) }}>
          <BulletChartComponent
            key={`util-${departmentFilter}-${utilizationData.map((d) => d.category).join('|')}-${Math.round(utilHeight)}`}
            id="provider-utilization"
            theme={chartTheme}
            dataSource={utilizationData}
            valueField="value"
            targetField="target"
            categoryField="category"
            valueFill="color"
            valueHeight={18}
            type="Rect"
            targetTypes={['Rect']}
            targetWidth={5}
            targetColor="var(--color-sf-fg-primary)"
            minimum={0}
            maximum={100}
            interval={20}
            height={utilHeight ? `${Math.round(utilHeight)}px` : '100%'}
            animation={{ enable: true, duration: 800 }}
            tooltip={{ enable: true }}
            dataLabel={{
              enable: true,
              labelStyle: { size: '11px', fontFamily: CHART_FONT_FAMILY, fontWeight: '600', color: 'var(--color-sf-fg-secondary)' },
            }}
            labelFormat="{value}%"
            margin={{ left: 110, right: 40, top: 16, bottom: 16 }}
            categoryLabelStyle={{ size: '12px', fontFamily: CHART_FONT_FAMILY, fontWeight: '600', color: 'var(--color-sf-fg-primary)' }}
            labelStyle={{ size: '10px', fontFamily: CHART_FONT_FAMILY, color: 'var(--color-sf-fg-secondary)' }}
            legendSettings={{ visible: false }}
          >
            <Inject services={[BulletTooltip]} />
            <BulletRangeCollectionDirective>
              <BulletRangeDirective end={70} color={RANGE_LOW} opacity={0.6} />
              <BulletRangeDirective end={85} color={RANGE_MID} opacity={0.6} />
              <BulletRangeDirective end={100} color={RANGE_HIGH} opacity={0.6} />
            </BulletRangeCollectionDirective>
          </BulletChartComponent>
          </div>
        </div>

        <div id="cancellation" style={{ gridColumn: 'span 2', minWidth: 0, ...cardSurface }}>
          <div style={sectionTitle}>Cancellation Reasons</div>
          <div style={{ height: chartFillHeight({ rows: 2, reserve: 300 }) }}>
          <AccumulationChartComponent
            theme={chartTheme}
            height="100%"
            tooltip={{ enable: true }}
            legendSettings={{ ...accumulationLegendSettings, position: 'Bottom' }}
            margin={{ top: 16, bottom: 16, left: 16, right: 16 }}
            centerLabel={{
              text: `${totalCancellations}`,
              textStyle: {
                fontFamily: CHART_FONT_FAMILY,
                size: '18px',
                fontWeight: '700',
                color: 'var(--color-sf-fg-primary)',
              },
            }}
          >
            <Inject services={[PieSeries, AccumulationLegend, AccumulationTooltip, AccumulationDataLabel]} />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective
                dataSource={cancellationData}
                xName="reason"
                yName="count"
                name="Cancellations"
                type="Pie"
                innerRadius="60%"
                startAngle={0}
                endAngle={360}
                explode
                explodeOffset="8px"
                pointColorMapping="color"
                dataLabel={{ visible: true, name: 'reason', position: 'Outside', font: { fontFamily: CHART_FONT_FAMILY, size: '12px' } }}
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
