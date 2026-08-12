import React from 'react';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Filter,
  Toolbar,
  DetailRow,
} from '@syncfusion/ej2-react-grids';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { listProviders } from '@services/healthcare.service';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { StatusBadge } from '@components/shared/StatusBadge';
import { InitialsAvatar } from '@components/shared/InitialsAvatar';
import { LoadingState } from '@components/shared/LoadingState';
import { ProviderScheduleDetail } from '@components/providers/ProviderScheduleDetail';
import { useNavigate } from 'react-router-dom';

const CHIP_COLORS: Record<string, { bg: string; fg: string }> = {
  cardiology: { bg: 'var(--color-sf-chip-cardiology-bg)', fg: 'var(--color-sf-chip-cardiology-fg)' },
  neurology: { bg: 'var(--color-sf-chip-neurology-bg)', fg: 'var(--color-sf-chip-neurology-fg)' },
  orthopedics: { bg: 'var(--color-sf-chip-orthopedics-bg)', fg: 'var(--color-sf-chip-orthopedics-fg)' },
  pediatrics: { bg: 'var(--color-sf-chip-pediatrics-bg)', fg: 'var(--color-sf-chip-pediatrics-fg)' },
  dermatology: { bg: 'var(--color-sf-chip-dermatology-bg)', fg: 'var(--color-sf-chip-dermatology-fg)' },
  ophthalmology: { bg: 'var(--color-sf-chip-ophthalmology-bg)', fg: 'var(--color-sf-chip-ophthalmology-fg)' },
  'internal medicine': { bg: 'var(--color-sf-chip-internal-medicine-bg)', fg: 'var(--color-sf-chip-internal-medicine-fg)' },
  'family medicine': { bg: 'var(--color-sf-chip-family-medicine-bg)', fg: 'var(--color-sf-chip-family-medicine-fg)' },
  'obstetrics & gynecology': { bg: 'var(--color-sf-chip-obstetrics-gynecology-bg)', fg: 'var(--color-sf-chip-obstetrics-gynecology-fg)' },
  'obstetrics': { bg: 'var(--color-sf-chip-obstetrics-bg)', fg: 'var(--color-sf-chip-obstetrics-fg)' },
  gynecology: { bg: 'var(--color-sf-chip-gynecology-bg)', fg: 'var(--color-sf-chip-gynecology-fg)' },
  endocrinology: { bg: 'var(--color-sf-chip-endocrinology-bg)', fg: 'var(--color-sf-chip-endocrinology-fg)' },
  oncology: { bg: 'var(--color-sf-chip-oncology-bg)', fg: 'var(--color-sf-chip-oncology-fg)' },
  psychiatry: { bg: 'var(--color-sf-chip-psychiatry-bg)', fg: 'var(--color-sf-chip-psychiatry-fg)' },
  gastroenterology: { bg: 'var(--color-sf-chip-gastroenterology-bg)', fg: 'var(--color-sf-chip-gastroenterology-fg)' },
  urology: { bg: 'var(--color-sf-chip-urology-bg)', fg: 'var(--color-sf-chip-urology-fg)' },
  radiology: { bg: 'var(--color-sf-chip-radiology-bg)', fg: 'var(--color-sf-chip-radiology-fg)' },
  pulmonology: { bg: 'var(--color-sf-chip-pulmonology-bg)', fg: 'var(--color-sf-chip-pulmonology-fg)' },
  nephrology: { bg: 'var(--color-sf-chip-nephrology-bg)', fg: 'var(--color-sf-chip-nephrology-fg)' },
  rheumatology: { bg: 'var(--color-sf-chip-rheumatology-bg)', fg: 'var(--color-sf-chip-rheumatology-fg)' },
};

const NEUTRAL_CHIP = { bg: 'var(--color-sf-chip-neutral-bg)', fg: 'var(--color-sf-chip-neutral-fg)' };

function chipColor(value: string): { bg: string; fg: string } {
  const key = value.trim().toLowerCase();
  const match = Object.keys(CHIP_COLORS).find((k) => key.includes(k));
  return match ? CHIP_COLORS[match] : NEUTRAL_CHIP;
}

const Chip: React.FC<{ value?: string }> = ({ value }) => {
  if (!value) return <span style={{ color: 'var(--color-sf-fg-quinary)' }}>—</span>;
  const { bg, fg } = chipColor(value);
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color: fg,
      }}
    >
      {value}
    </span>
  );
};

export const ProviderListPage: React.FC = () => {
  const navigate = useNavigate();
  const query = useAsyncResult(() => listProviders(), []);
  const items = query.data?.data?.items ?? [];

  return (
    <div>
      {query.error && <ErrorBanner message={query.error} onRetry={query.refresh} />}
      {query.loading && !query.data ? (
        <LoadingState label="Loading providers…" />
      ) : items.length === 0 ? (
        <EmptyState title="No providers found" description="Provider data will appear once the backend is seeded." />
      ) : (
        <GridComponent
          dataSource={items}
          allowPaging
          allowSorting
          allowFiltering
          filterSettings={{ type: 'Excel' }}
          pageSettings={{ pageSize: 50 }}
          toolbar={['Search']}
          detailTemplate={(props: any) => <ProviderScheduleDetail providerId={props.providerId} />}
        >
          <ColumnsDirective>
            <ColumnDirective
              headerText="Provider"
              width="260"
              field="lastName"
              template={(props: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <InitialsAvatar first={props.firstName} last={props.lastName} size={40} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-sf-fg-primary)' }}>
                      Dr. {props.firstName} {props.lastName}{props.title ? `, ${props.title}` : ''}
                    </div>
                  </div>
                </div>
              )}
            />
            <ColumnDirective field="specialty" headerText="Specialty" width="160" template={(props: any) => <Chip value={props.specialty} />} />
            <ColumnDirective
              field="averageAppointmentDuration"
              headerText="Avg Duration"
              width="130"
              template={(props: any) => {
                const v = Number(props?.averageAppointmentDuration ?? 0);
                if (!v) return <span style={{ color: 'var(--color-sf-fg-quinary)' }}>—</span>;
                return <span style={{ fontSize: 13 }}>{v} min</span>;
              }}
            />
            <ColumnDirective
              field="locationName"
              headerText="Location"
              width="160"
              hideAtMedia="(max-width: 1023px)"
            />
            <ColumnDirective
              field="npiNumber"
              headerText="NPI"
              width="120"
              hideAtMedia="(max-width: 1023px)"
            />
            <ColumnDirective
              field="phoneNumber"
              headerText="Phone"
              width="140"
            />
            <ColumnDirective
              field="isActive"
              headerText="Status"
              width="100"
              hideAtMedia="(max-width: 640px)"
              template={(props: any) => <StatusBadge status={props.isActive ? 'Active' : 'Inactive'} />}
            />
            <ColumnDirective
              headerText="Actions"
              width="110"
              allowFiltering={false}
              allowSorting={false}
              template={(props: any) => (
                <ButtonComponent cssClass="e-flat e-primary e-small" onClick={() => navigate(`/providers/${props.providerId}`)}>
                  View
                </ButtonComponent>
              )}
            />
          </ColumnsDirective>
          <Inject services={[Page, Sort, Filter, Toolbar, DetailRow]} />
        </GridComponent>
      )}
    </div>
  );
};
