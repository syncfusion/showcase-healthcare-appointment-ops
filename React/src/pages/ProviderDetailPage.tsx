import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TabComponent, TabItemDirective, TabItemsDirective } from '@syncfusion/ej2-react-navigations';
import { CalendarDays, Users, Activity, XCircle, UserX } from 'lucide-react';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { getProvider, getProviderUtilization, getNoShowTrends, listAppointments } from '@services/healthcare.service';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';
import { InitialsAvatar } from '@components/shared/InitialsAvatar';
import { KpiCard } from '@components/shared/KpiCard';
import { ProviderScheduleTab } from '@components/providers/ProviderScheduleTab';
import { ProviderAnalyticsTab } from '@components/providers/ProviderAnalyticsTab';

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

const TAB_KEYS = ['schedule', 'analytics'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export const ProviderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('schedule');

  const providerQuery = useAsyncResult(() => getProvider(id!), [id]);

  const provider = providerQuery.data?.data;

  const today = useMemo(() => new Date(), []);

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    return { start: toYmd(start), end: toYmd(end) };
  }, []);

  const apptWindow = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 14);
    return { from: toYmd(from), to: toYmd(to) };
  }, []);
  const apptsQuery = useAsyncResult(
    () => listAppointments({ providerId: id!, dateFrom: apptWindow.from, dateTo: apptWindow.to, limit: '500' }),
    [id, apptWindow]
  );
  const appointments = useMemo(() => apptsQuery.data?.data?.items ?? [], [apptsQuery.data]);

  const utilizationQuery = useAsyncResult(() => getProviderUtilization(range.start, range.end, id), [id, range]);
  const utilizationData = useMemo(() => {
    const rows = utilizationQuery.data?.data ?? [];
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
  }, [utilizationQuery.data]);
  const overallUtilization = useMemo(() => {
    const rows = utilizationQuery.data?.data ?? [];
    const appts = rows.reduce((s, r) => s + r.appointmentCount, 0);
    const slots = rows.reduce((s, r) => s + r.totalSlots, 0);
    return slots > 0 ? Math.round((100 * appts) / slots) : null;
  }, [utilizationQuery.data]);

  const noShowQuery = useAsyncResult(
    () => (provider ? getNoShowTrends(range.start, range.end, provider.departmentId) : Promise.resolve({ status: 'ok' as const, data: [] })),
    [provider?.departmentId, range]
  );
  const noShowData = useMemo(() => {
    const rows = noShowQuery.data?.data ?? [];
    return [...rows]
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((r) => ({ month: monthLabel(r.period), rate: Math.round(r.noShowRate * 1000) / 10 }));
  }, [noShowQuery.data]);

  const kpis = useMemo(() => {
    const startWeek = startOfWeek(today).getTime();
    const endWeek = startWeek + 7 * 86400000;
    const todayYmd = toYmd(today);
    let apptsToday = 0;
    let cancelled = 0;
    let noShow = 0;
    const weekPatients = new Set<string>();
    appointments.forEach((a) => {
      const t = new Date(a.scheduledDateTime).getTime();
      if (toYmd(new Date(a.scheduledDateTime)) === todayYmd) apptsToday += 1;
      if (t >= startWeek && t < endWeek) weekPatients.add(a.patientId);
      if (a.status === 'Cancelled') cancelled += 1;
      if (a.status === 'NoShow') noShow += 1;
    });
    const total = appointments.length;
    return {
      apptsToday,
      patientsThisWeek: weekPatients.size,
      cancellationRate: total > 0 ? (100 * cancelled) / total : null,
      noShowRate: total > 0 ? (100 * noShow) / total : null,
    };
  }, [appointments, today]);

  if (providerQuery.error) {
    return <ErrorBanner message={providerQuery.error} onRetry={providerQuery.refresh} />;
  }

  if (!provider && providerQuery.loading) {
    return <LoadingState label="Loading provider…" />;
  }

  if (!provider) {
    return <EmptyState title="Provider not found" description="The requested provider does not exist." />;
  }

  const pct = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)}%`);

  const onTabSelecting = (e: { selectingIndex: number }) => {
    if (e.selectingIndex >= 0 && e.selectingIndex < TAB_KEYS.length) setActiveTab(TAB_KEYS[e.selectingIndex]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--color-sf-bg-primary)', padding: 20, borderRadius: 8, boxShadow: 'var(--shadow-default)' }}>
        <InitialsAvatar first={provider.firstName} last={provider.lastName} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Dr. {provider.firstName} {provider.lastName}, {provider.title}</div>
          <div style={{ fontSize: 14, color: 'var(--color-sf-fg-tertiary)' }}>{provider.specialty} • {provider.locationName}</div>
          <div style={{ fontSize: 12, color: 'var(--color-sf-fg-quinary)', marginTop: 4 }}>NPI: {provider.npiNumber} • {provider.phoneNumber}</div>
        </div>
      </div>

      
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard title="Appointments Today" value={kpis.apptsToday} loading={apptsQuery.loading} icon={<CalendarDays size={16} />} />
        <KpiCard title="Patients This Week" value={kpis.patientsThisWeek} loading={apptsQuery.loading} icon={<Users size={16} />} />
        <KpiCard title="Utilization" value={overallUtilization === null ? '—' : `${overallUtilization}%`} loading={utilizationQuery.loading} icon={<Activity size={16} />} />
        <KpiCard title="Cancellation Rate" value={pct(kpis.cancellationRate)} loading={apptsQuery.loading} icon={<XCircle size={16} />} />
        <KpiCard title="No-Show Rate" value={pct(kpis.noShowRate)} loading={apptsQuery.loading} icon={<UserX size={16} />} />
      </div>

      
      <TabComponent heightAdjustMode="Auto" selectedItem={TAB_KEYS.indexOf(activeTab)} selecting={onTabSelecting}>
        <TabItemsDirective>
          <TabItemDirective header={{ text: 'Schedule' }} />
          <TabItemDirective header={{ text: 'Analytics' }} />
        </TabItemsDirective>
      </TabComponent>

      <div>
        {activeTab === 'schedule' && (
          <ProviderScheduleTab
            appointments={appointments}
            loading={apptsQuery.loading && !apptsQuery.data}
            error={apptsQuery.error}
            onRetry={apptsQuery.refresh}
            selectedDate={today}
          />
        )}
        {activeTab === 'analytics' && (
          <ProviderAnalyticsTab
            utilizationData={utilizationData}
            utilizationLoading={utilizationQuery.loading && !utilizationQuery.data}
            utilizationError={utilizationQuery.error}
            onUtilizationRetry={utilizationQuery.refresh}
            noShowData={noShowData}
            noShowLoading={noShowQuery.loading && !noShowQuery.data}
            noShowError={noShowQuery.error}
            onNoShowRetry={noShowQuery.refresh}
            departmentName={provider.departmentName}
          />
        )}
      </div>
    </div>
  );
};
