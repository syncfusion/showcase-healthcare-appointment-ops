import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Filter,
  Toolbar,
  ColumnChooser,
  Search,
} from '@syncfusion/ej2-react-grids';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { listPatients } from '@services/healthcare.service';
import { useDebounce } from '@hooks/useDebounce';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { StatusBadge } from '@components/shared/StatusBadge';
import { InitialsAvatar } from '@components/shared/InitialsAvatar';
import { LoadingState } from '@components/shared/LoadingState';
import { fmtDateTime } from '../utils/dateFormat';

function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [pageSettings] = useState({ pageSizes: [5, 10, 25, 50, 100], pageSize: 50 });

  const query = useAsyncResult(() => listPatients(debouncedSearch || undefined, 0, 200), [debouncedSearch]);
  const items = query.data?.data?.items ?? [];

  const toolbarOptions = ['Search', 'ColumnChooser'];

  return (
    <div>
      {query.error && <ErrorBanner message={query.error} onRetry={query.refresh} />}

      {query.loading && !query.data ? (
        <LoadingState label="Loading patients…" />
      ) : items.length === 0 ? (
        <EmptyState title="No patients found" description="Try adjusting your search." />
      ) : (
        <GridComponent
          cssClass="patient-grid"
          dataSource={items}
          allowPaging
          allowSorting
          allowFiltering
          filterSettings={{ type: 'Excel' }}
          pageSettings={pageSettings}
          searchSettings={{ fields: ['firstName', 'lastName', 'medicalRecordNumber', 'phoneNumber', 'primaryCareProviderName'], operator: 'contains', ignoreCase: true }}
          toolbar={toolbarOptions}
          showColumnChooser={true}
          rowSelected={(args: any) => {
            const id = args.data?.patientId;
            if (id) navigate(`/patients/${id}`);
          }}
        >
          <ColumnsDirective>
            <ColumnDirective
              field="lastName"
              headerText="Patient"
              width="260"
              template={(props: any) => {
                const age = calcAge(props.dateOfBirth);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <InitialsAvatar first={props.firstName} last={props.lastName} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-sf-fg-primary)' }}>
                        {props.firstName} {props.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>
                        {props.medicalRecordNumber}{age != null ? ` · Age ${age}` : ''}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <ColumnDirective field="gender" headerText="Gender" width="100" />
            <ColumnDirective field="phoneNumber" headerText="Phone" width="140" />
            <ColumnDirective
              field="primaryCareProviderName"
              headerText="Primary Care Provider"
              width="180"         
              hideAtMedia="(max-width: 1023px)"
            />
            <ColumnDirective
              field="nextAppointmentDateTime"
              headerText="Upcoming Appointment"
              width="220"
              template={(props: any) => {
                if (!props.nextAppointmentDateTime) {
                  return <span style={{ color: 'var(--color-sf-fg-quinary)' }}>—</span>;
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-sf-fg-primary)' }}>
                      {fmtDateTime(props.nextAppointmentDateTime)}
                    </span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {props.nextAppointmentType && (
                        <span style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)' }}>{props.nextAppointmentType}</span>
                      )}
                      {props.nextAppointmentStatus && <StatusBadge status={props.nextAppointmentStatus} />}
                    </div>
                  </div>
                );
              }}
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
                <button
                  type="button"
                  className="e-btn e-flat e-primary e-small"
                  style={{ padding: '2px 12px' }}
                  onClick={() => navigate(`/patients/${props.patientId}`)}
                >
                  View
                </button>
              )}
            />
          </ColumnsDirective>
          <Inject services={[Page, Sort, Filter, Toolbar, ColumnChooser, Search]} />
        </GridComponent>
      )}
    </div>
  );
};
