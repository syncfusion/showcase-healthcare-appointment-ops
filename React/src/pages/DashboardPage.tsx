import React, { useMemo } from 'react';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { getDashboardKpis, listAppointments, getAppointmentVolume, getProviderUtilization } from '@services/healthcare.service';
import { KpiCard } from '@components/shared/KpiCard';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  Category,
  Legend,
  Tooltip,
  DataLabel,
  ColumnSeries,
  StackingColumnSeries,
} from '@syncfusion/ej2-react-charts';
import { ListViewComponent } from '@syncfusion/ej2-react-lists';
import { CalendarDays, UserCheck, Clock, TrendingUp, ListChecks } from 'lucide-react';
import type { AppointmentSummaryDto, VolumeDataPointDto, UtilizationDataPointDto } from '@models/dtos';
import {
  APPOINTMENT_TYPE_SERIES,
  BAR_RAMP,
  buildValueAxis,
  chartFillHeight,
  chartLegendSettings,
  chartInteraction,
  chartThemeName,
  COLUMN_STYLE,
  Highlight,
  Selection,
} from '../utils/chartTheme';
import { useTheme } from '../theme/ThemeProvider';

const UPCOMING_STATUSES = ['Scheduled', 'Confirmed', 'CheckedIn', 'InProgress', 'Completed'];

const STATUS_STYLES: Record<string, { fg: string; bg: string; label: string }> = {
  Scheduled: { fg: 'var(--color-sf-cyan-700)', bg: 'var(--color-sf-cyan-50)', label: 'Scheduled' },
  Confirmed: { fg: 'var(--color-sf-success-700)', bg: 'var(--color-sf-success-50)', label: 'Confirmed' },
  CheckedIn: { fg: 'var(--color-sf-brand-700)', bg: 'var(--color-sf-brand-50)', label: 'Checked In' },
  InProgress: { fg: 'var(--color-sf-warning-700)', bg: 'var(--color-sf-warning-50)', label: 'In Progress' },
  Completed: { fg: 'var(--color-sf-fg-secondary)', bg: 'var(--color-sf-bg-tertiary)', label: 'Completed' },
};
const NEUTRAL_STATUS = { fg: 'var(--color-sf-fg-tertiary)', bg: 'var(--color-sf-bg-tertiary)', label: 'Scheduled' };

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

function relativeDay(dt: Date): string {
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(dt) - startOf(today)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const DashboardPage: React.FC = () => {
  const { resolved } = useTheme();
  const chartTheme = chartThemeName(resolved);
  const kpis = useAsyncResult(() => getDashboardKpis(), []);
  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }, []);
  const upcoming = useAsyncResult(
    () => listAppointments({ dateFrom: todayRange.from, dateTo: todayRange.to, limit: '200' }),
    [todayRange],
  );

  
  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { startDate: toYmd(start), endDate: toYmd(end) };
  }, []);
  const volume = useAsyncResult(() => getAppointmentVolume(range.startDate, range.endDate), [range]);
  const utilization = useAsyncResult(() => getProviderUtilization(range.startDate, range.endDate), [range]);

  const volumeData = useMemo(() => {
    const rows = volume.data?.data ?? [];
    type VolumeRow = { department: string } & Record<string, number | string>;
    const byDept = new Map<string, VolumeRow>();
    rows.forEach((d: VolumeDataPointDto) => {
      let entry = byDept.get(d.departmentName);
      if (!entry) {
        entry = { department: d.departmentName };
        APPOINTMENT_TYPE_SERIES.forEach((s) => (entry![s.type] = 0));
        byDept.set(d.departmentName, entry);
      }
      if (d.appointmentType in entry) entry[d.appointmentType] = (entry[d.appointmentType] as number) + d.count;
    });
    const total = (e: VolumeRow) => APPOINTMENT_TYPE_SERIES.reduce((sum, s) => sum + (e[s.type] as number), 0);
    return Array.from(byDept.values()).sort((a, b) => total(b) - total(a));
  }, [volume.data]);

  const utilizationData = useMemo(() => {
    const rows = utilization.data?.data ?? [];
    const byProvider = new Map<string, { name: string; appts: number; slots: number }>();
    rows.forEach((d: UtilizationDataPointDto) => {
      const entry = byProvider.get(d.providerName) ?? { name: d.providerName, appts: 0, slots: 0 };
      entry.appts += d.appointmentCount;
      entry.slots += d.totalSlots;
      byProvider.set(d.providerName, entry);
    });
    return Array.from(byProvider.values())
      .map((p) => ({ name: p.name, rate: p.slots > 0 ? Math.round((100 * p.appts) / p.slots) : 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8)
      .map((d, i) => ({ ...d, color: BAR_RAMP[i % BAR_RAMP.length] }));
  }, [utilization.data]);

  const upcomingItems: UpcomingItem[] = useMemo(() => {
    const items = upcoming.data?.data?.items ?? [];
    return items
      .filter((a: AppointmentSummaryDto) => UPCOMING_STATUSES.includes(a.status))
      .sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime())
      .slice(0, 12)
      .map((a: AppointmentSummaryDto) => {
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
  }, [upcoming.data]);

  const upcomingTemplate = (item: UpcomingItem) => (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 14 }}>
      <span style={{ width: 4, alignSelf: 'stretch', minHeight: 40, borderRadius: 'var(--radius-full)', background: item.statusFg, flexShrink: 0 }} />
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: item.statusBg,
          color: item.statusFg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
          border: '1px solid var(--color-sf-border-secondary)',
        }}
      >
        {item.initials}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-sf-fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3, minWidth: 0, flex: '1 1 auto' }}>{item.patientName}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-sf-fg-secondary)', background: 'var(--color-sf-bg-tertiary)', padding: '1px 8px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.appointmentType}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4, marginTop: 2 }}>{item.providerName}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-sf-fg-primary)' }}>{item.time}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-sf-fg-quinary)' }}>{item.day}</span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: item.statusFg,
            background: item.statusBg,
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
            lineHeight: 1.5,
          }}
        >
          {item.statusLabel}
        </span>
      </div>
    </div>
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

  const kpiData = kpis.data?.data;

  return (
    <div>
      {(kpis.error || upcoming.error) && (
        <ErrorBanner message={(kpis.error ?? upcoming.error) || 'Failed to load dashboard data'} onRetry={() => { kpis.refresh(); upcoming.refresh(); }} />
      )}

      <div className="responsive-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div id="kpis" style={{ gridColumn: 'span 4', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <KpiCard title="Today's Appts" value={kpiData?.totalAppointments ?? '—'} loading={kpis.loading} icon={<CalendarDays size={16} />} />
          <KpiCard title="Completed" value={kpiData?.completedAppointments ?? '—'} loading={kpis.loading} icon={<UserCheck size={16} />} />
          <KpiCard title="Avg Wait" value={kpiData ? `${kpiData.averageWaitTimeMinutes}m` : '—'} loading={kpis.loading} icon={<Clock size={16} />} />
          <KpiCard title="No-Show Rate" value={kpiData ? `${(kpiData.noShowRate * 100).toFixed(1)}%` : '—'} loading={kpis.loading} icon={<TrendingUp size={16} />} />
          <KpiCard title="Open Waitlist" value={kpiData?.openWaitlistCount ?? '—'} loading={kpis.loading} icon={<ListChecks size={16} />} />
        </div>

        <div id="volume" style={{ gridColumn: 'span 2', minWidth: 0, ...cardSurface }}>
          <div style={sectionTitle}>Appointment Type Mix by Department</div>
          {volume.loading ? (
            <LoadingState inline label="Loading appointment volume…" />
          ) : volume.error ? (
            <ErrorBanner message={volume.error} onRetry={volume.refresh} />
          ) : volumeData.length === 0 ? (
            <EmptyState title="No appointment volume" description="No appointments in the last 30 days." />
          ) : (
            <div style={{ height: chartFillHeight({ rows: 1, reserve: 560, cap: 620 }) }}>
            <ChartComponent
              theme={chartTheme}
              primaryXAxis={{ valueType: 'Category', title: 'Department' }}
              primaryYAxis={{ title: 'Share', labelFormat: '{value}%', minimum: 0, maximum: 100, interval: 20 }}
              legendSettings={chartLegendSettings}
              height="100%"
              tooltip={{ enable: true }}
              {...chartInteraction}
            >
              <Inject services={[StackingColumnSeries, Legend, Tooltip, DataLabel, Category, Highlight, Selection]} />
              <SeriesCollectionDirective>
                {APPOINTMENT_TYPE_SERIES.map((s, i) => (
                  <SeriesDirective
                    key={s.type}
                    dataSource={volumeData}
                    xName="department"
                    yName={s.type}
                    name={s.type}
                    type="StackingColumn100"
                    fill={s.color}
                    columnWidth={COLUMN_STYLE.columnWidth}
                    cornerRadius={i === APPOINTMENT_TYPE_SERIES.length - 1 ? COLUMN_STYLE.cornerRadius : undefined}
                  />
                ))}
              </SeriesCollectionDirective>
            </ChartComponent>
            </div>
          )}
        </div>

        <div id="utilization" style={{ gridColumn: 'span 2', minWidth: 0, ...cardSurface }}>
          <div style={sectionTitle}>Provider Utilization</div>
          {utilization.loading ? (
            <LoadingState inline label="Loading provider utilization…" />
          ) : utilization.error ? (
            <ErrorBanner message={utilization.error} onRetry={utilization.refresh} />
          ) : utilizationData.length === 0 ? (
            <EmptyState title="No utilization data" description="No appointments in the last 30 days." />
          ) : (
            <div style={{ height: chartFillHeight({ rows: 1, reserve: 560, cap: 620 }) }}>
            <ChartComponent
              theme={chartTheme}
              primaryXAxis={{ valueType: 'Category', title: 'Provider' }}
              primaryYAxis={buildValueAxis(utilizationData.map((d) => d.rate), { title: 'Utilization %', labelFormat: '{value}%' })}
              legendSettings={{ visible: false }}
              height="100%"
              tooltip={{ enable: true }}
              {...chartInteraction}
            >
              <Inject services={[ColumnSeries, Legend, Tooltip, DataLabel, Category, Highlight, Selection]} />
              <SeriesCollectionDirective>
                <SeriesDirective dataSource={utilizationData} xName="name" yName="rate" name="Utilization %" type="Column" pointColorMapping="color" {...COLUMN_STYLE} />
              </SeriesCollectionDirective>
            </ChartComponent>
            </div>
          )}
        </div>

        <div id="upcoming" style={{ gridColumn: 'span 4', minWidth: 0, ...cardSurface, padding: 0, overflow: 'hidden' }}>
          <div style={{ ...sectionTitle, marginBottom: 0, padding: '16px 20px', borderBottom: upcomingItems.length ? '1px solid var(--color-sf-border-secondary)' : 'none' }}>Today's Appointments</div>
          {upcoming.loading ? (
            <LoadingState inline label="Loading upcoming appointments…" />
          ) : upcoming.error ? (
            <div style={{ padding: 20 }}>
              <ErrorBanner message={upcoming.error} onRetry={upcoming.refresh} />
            </div>
          ) : !upcomingItems.length ? (
            <div style={{ padding: 20 }}>
              <EmptyState title="No appointments today" description="Today's appointments will appear here." />
            </div>
          ) : (
            <div style={{ maxHeight: 'clamp(340px, calc(100vh - 640px), 640px)', overflow: 'auto' }}>
              <ListViewComponent
                dataSource={upcomingItems as unknown as { [key: string]: Object }[]}
                fields={{ id: 'appointmentId', text: 'patientName' }}
                template={upcomingTemplate as unknown as string}
                cssClass="dashboard-upcoming-list"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
