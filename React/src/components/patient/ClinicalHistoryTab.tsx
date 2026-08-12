import React, { useMemo, useState } from 'react';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { getPatientClinicalHistory } from '@services/healthcare.service';
import { fmtDate } from '../../utils/dateFormat';
import {
  AccordionComponent,
  AccordionItemDirective,
  AccordionItemsDirective,
} from '@syncfusion/ej2-react-navigations';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject as ChartInject,
  LineSeries,
  DateTime,
  Legend as ChartLegend,
  Tooltip as ChartTooltip,
} from '@syncfusion/ej2-react-charts';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';
import { StatusBadge } from '@components/shared/StatusBadge';
import { CHART_FONT_FAMILY, chartFillHeight, chartThemeName } from '../../utils/chartTheme';
import { useTheme } from '../../theme/ThemeProvider';
import type { EncounterDto, ReferralDto, VitalReadingDto } from '@models/dtos';

const ENCOUNTER_TYPES = ['All', 'Visit', 'Telehealth', 'Procedure', 'Lab Visit'] as const;

export const ClinicalHistoryTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { resolved } = useTheme();
  const chartTheme = chartThemeName(resolved);
  const historyQ = useAsyncResult(() => getPatientClinicalHistory(patientId), [patientId]);
  const [typeFilter, setTypeFilter] = useState<(typeof ENCOUNTER_TYPES)[number]>('All');

  const data = historyQ.data?.data;

  const filteredEncounters = useMemo(() => {
    if (!data) return [];
    if (typeFilter === 'All') return data.encounters;
    return data.encounters.filter((e) => e.encounterType === typeFilter);
  }, [data, typeFilter]);

  if (historyQ.loading) return <LoadingState inline label="Loading clinical history…" />;
  if (historyQ.error) return <ErrorBanner message={historyQ.error} onRetry={historyQ.refresh} />;
  if (!data) return <EmptyState title="No clinical history" description="No encounters recorded for this patient." />;

  const vitalSeries = groupVitalSeries(data.vitals);
  const lipids = data.labs.filter((l) => l.category === 'Lipid');
  const metabolic = data.labs.filter((l) => l.testName === 'Hemoglobin A1c' || l.testName === 'Fasting Glucose');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      <section>
        <SectionTitle title="Vital Signs Trend" subtitle="Last 6 readings" />
        {vitalSeries.length === 0 ? (
          <EmptyState title="No vitals recorded" />
        ) : (
          <div style={{ height: chartFillHeight({ rows: 2, reserve: 360, cap: 420 }) }}>
          <ChartComponent
            theme={chartTheme}
            primaryXAxis={{ valueType: 'DateTime', labelFormat: 'MMM d' }}
            primaryYAxis={{ labelFormat: '{value}' }}
            height="100%"
            tooltip={{ enable: true, format: '${series.name}: ${point.y} (${point.x})' }}
            legendSettings={{ visible: true, position: 'Bottom', textStyle: { fontFamily: CHART_FONT_FAMILY } }}
          >
            <ChartInject services={[LineSeries, DateTime, ChartLegend, ChartTooltip]} />
            <SeriesCollectionDirective>
              {vitalSeries.map((s) => (
                <SeriesDirective
                  key={s.name}
                  dataSource={s.points}
                  xName="date"
                  yName="value"
                  name={s.name}
                  type="Line"
                  width={2}
                  marker={{ visible: true, width: 6, height: 6 }}
                />
              ))}
            </SeriesCollectionDirective>
          </ChartComponent>
          </div>
        )}
      </section>


      <section>
        <SectionTitle title="Lab Result Trends" subtitle="Metabolic & lipid panels over time" />
        {lipids.length === 0 && metabolic.length === 0 ? (
          <EmptyState title="No lab data" />
        ) : (
          <div style={{ height: chartFillHeight({ rows: 2, reserve: 360, cap: 420 }) }}>
          <ChartComponent
            theme={chartTheme}
            primaryXAxis={{ valueType: 'DateTime', labelFormat: 'MMM d, yy' }}
            height="100%"
            tooltip={{ enable: true, format: '${series.name}: ${point.y}${point.unit}' }}
            legendSettings={{ visible: true, position: 'Bottom', textStyle: { fontFamily: CHART_FONT_FAMILY } }}
          >
            <ChartInject services={[LineSeries, DateTime, ChartLegend, ChartTooltip]} />
            <SeriesCollectionDirective>
              {[...lipids, ...metabolic].map((test) => (
                <SeriesDirective
                  key={test.testName}
                  dataSource={[{ date: new Date(test.collectedDate), value: test.value, unit: test.unit }]}
                  xName="date"
                  yName="value"
                  name={`${test.testName} (${test.unit})`}
                  type="Line"
                  width={2}
                  marker={{ visible: true, width: 7, height: 7, fill: test.isAbnormal ? 'var(--color-sf-fg-error-primary)' : 'var(--color-sf-fg-brand-primary)' }}
                />
              ))}
            </SeriesCollectionDirective>
          </ChartComponent>
          </div>
        )}
      </section>


      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <SectionTitle title="Encounters" subtitle={`${filteredEncounters.length} of ${data.encounters.length} records`} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {ENCOUNTER_TYPES.map((t) => (
              <FilterChip key={t} label={t} active={typeFilter === t} onClick={() => setTypeFilter(t)} />
            ))}
          </div>
        </div>
        {filteredEncounters.length === 0 ? (
          <EmptyState title="No encounters match this filter" />
        ) : (
          <AccordionComponent expandMode="Single">
            <AccordionItemsDirective>
              {filteredEncounters.map((e) => (
                <AccordionItemDirective
                  key={e.encounterId}
                  header={accordionHeader(e)}
                  content={() => AccordionContent(e)}
                />
              ))}
            </AccordionItemsDirective>
          </AccordionComponent>
        )}
      </section>

      
      <section>
        <SectionTitle title="Referrals" subtitle={`${data.referrals.length} on record`} />
        {data.referrals.length === 0 ? (
          <EmptyState title="No referrals" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {data.referrals.map((r) => <ReferralCard key={r.referralId} referral={r} />)}
          </div>
        )}
      </section>
    </div>
  );
};

function groupVitalSeries(vitals: VitalReadingDto[]): { name: string; points: { date: Date; value: number }[] }[] {
  const byMetric = new Map<string, { date: Date; value: number }[]>();
  vitals.forEach((v) => {
    if (!byMetric.has(v.metric)) byMetric.set(v.metric, []);
    byMetric.get(v.metric)!.push({ date: new Date(v.readingDate), value: v.value });
  });
  return Array.from(byMetric.entries()).map(([name, points]) => ({ name, points: points.reverse() }));
}

const accordionHeader = (e: EncounterDto): string =>
  `${fmtDate(e.encounterDate)} • ${e.encounterType} • ${e.providerName}`;

function AccordionContent(e: EncounterDto): React.ReactNode {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '4px 0' }}>
      <Detail label="Department" value={e.departmentName} />
      <Detail label="Status" value={<StatusBadge status={e.status} />} />
      <Detail label="Reason" value={e.reason} />
      <Detail label="Provider" value={e.providerName} />
      <Detail label="Assessment" value={e.assessment} />
      <Detail label="Plan" value={e.plan} />
    </div>
  );
}

const ReferralCard: React.FC<{ referral: ReferralDto }> = ({ referral }) => (
  <div style={{ background: 'var(--color-sf-bg-secondary)', borderRadius: 8, padding: 12, border: '1px solid var(--color-sf-border-secondary)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontWeight: 700 }}>{referral.specialty}</span>
      <StatusBadge status={referral.status} />
    </div>
    <div style={{ fontSize: 13, color: 'var(--color-sf-fg-tertiary)', marginBottom: 4 }}>
      {fmtDate(referral.requestedDate)} • From {referral.fromProvider}
    </div>
    <div style={{ fontSize: 13 }}>{referral.reason}</div>
  </div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>{subtitle}</div>}
  </div>
);

const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 10px',
      borderRadius: 999,
      border: '1px solid var(--color-sf-border-secondary)',
      background: active ? 'var(--color-sf-bg-brand-solid)' : 'transparent',
      color: active ? 'var(--color-sf-fg-on-brand-primary)' : 'var(--color-sf-fg-secondary)',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 500,
    }}
  >
    {label}
  </button>
);

const Detail: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13 }}>{value || '—'}</div>
  </div>
);
