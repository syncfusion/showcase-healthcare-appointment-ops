import React, { useState } from 'react';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Toolbar,
  Edit,
} from '@syncfusion/ej2-react-grids';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { listDepartments, listLocations } from '@services/healthcare.service';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { LoadingState } from '@components/shared/LoadingState';
import { useTheme, type ThemeMode } from '../theme/ThemeProvider';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'system', label: 'System' },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'locations' | 'theme'>('departments');
  const { mode, setMode } = useTheme();
  const departmentsQuery = useAsyncResult(() => listDepartments(), []);
  const locationsQuery = useAsyncResult(() => listLocations(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-sf-border-secondary)' }}>
        {(['departments', 'locations', 'theme'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-sf-border-brand-solid)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--color-sf-fg-brand-primary)' : 'var(--color-sf-fg-tertiary)',
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {tab === 'departments' ? 'Departments' : tab === 'locations' ? 'Locations' : 'Appearance'}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--color-sf-bg-primary)', borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-default)' }}>
        {activeTab === 'departments' && (
          <>
            {departmentsQuery.error && <ErrorBanner message={departmentsQuery.error} onRetry={departmentsQuery.refresh} />}
            {departmentsQuery.loading && !departmentsQuery.data ? (
              <LoadingState inline label="Loading departments…" />
            ) : (
              <GridComponent
                dataSource={departmentsQuery.data?.data ?? []}
                enableAdaptiveUI
                adaptiveUIMode="Mobile"
                allowPaging
                pageSettings={{ pageSize: 20 }}
                allowSorting
                >
                <ColumnsDirective>
                  <ColumnDirective field="departmentCode" headerText="Code" width="100" />
                  <ColumnDirective field="departmentName" headerText="Name" width="200" />
                  <ColumnDirective field="locationName" headerText="Location" width="200" />
                  <ColumnDirective field="isActive" headerText="Active" width="90" displayAsCheckBox />
                </ColumnsDirective>
                <Inject services={[Page, Sort, Toolbar, Edit]} />
              </GridComponent>
            )}
          </>
        )}

        {activeTab === 'locations' && (
          <>
            {locationsQuery.error && <ErrorBanner message={locationsQuery.error} onRetry={locationsQuery.refresh} />}
            {locationsQuery.loading && !locationsQuery.data ? (
              <LoadingState inline label="Loading locations…" />
            ) : (
              <GridComponent
                dataSource={locationsQuery.data?.data ?? []}
                enableAdaptiveUI
                adaptiveUIMode="Mobile"
                allowPaging
                pageSettings={{ pageSize: 20 }}
                allowSorting
                >
                <ColumnsDirective>
                  <ColumnDirective field="locationName" headerText="Name" width="200" />
                  <ColumnDirective field="addressLine" headerText="Address" width="240" />
                  <ColumnDirective field="city" headerText="City" width="120" />
                  <ColumnDirective field="state" headerText="State" width="80" />
                  <ColumnDirective field="postalCode" headerText="ZIP" width="100" />
                  <ColumnDirective field="phoneNumber" headerText="Phone" width="140" />
                  <ColumnDirective field="timeZone" headerText="Time Zone" width="160" />
                  <ColumnDirective field="isActive" headerText="Active" width="90" displayAsCheckBox />
                </ColumnsDirective>
                <Inject services={[Page, Sort, Toolbar, Edit]} />
              </GridComponent>
            )}
          </>
        )}

        {activeTab === 'theme' && (
          <div style={{ maxWidth: 400 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: 'var(--color-sf-fg-primary)' }}>Appearance</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-sf-border-secondary)' }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--color-sf-fg-primary)' }}>Theme</div>
                <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>Choose light, dark, or follow your system setting</div>
              </div>
              <div
                role="radiogroup"
                aria-label="Theme"
                style={{
                  display: 'flex',
                  gap: 2,
                  padding: 2,
                  background: 'var(--color-sf-bg-tertiary)',
                  borderRadius: 'var(--radius-8)',
                }}
              >
                {THEME_OPTIONS.map(({ mode: optMode, label }) => {
                  const active = mode === optMode;
                  return (
                    <button
                      key={optMode}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMode(optMode)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: 'var(--radius-6)',
                        background: active ? 'var(--color-sf-bg-primary)' : 'transparent',
                        color: active ? 'var(--color-sf-fg-brand-primary)' : 'var(--color-sf-fg-tertiary)',
                        fontSize: 12,
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        boxShadow: active ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
