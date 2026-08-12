import React, { useRef, useState } from 'react';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { getPatientMedications } from '@services/healthcare.service';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Toolbar,
  ExcelExport,
} from '@syncfusion/ej2-react-grids';
import { TabComponent, TabItemDirective, TabItemsDirective } from '@syncfusion/ej2-react-navigations';
import { ProgressBarComponent } from '@syncfusion/ej2-react-progressbar';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';
import { StatusBadge } from '@components/shared/StatusBadge';
import type { MedicationDto, MedicationRefillDto } from '@models/dtos';
import { fmtDate } from '../../utils/dateFormat';

export const MedicationsTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const medsQ = useAsyncResult(() => getPatientMedications(patientId), [patientId]);
  const [subTab, setSubTab] = useState<'active' | 'history' | 'refills'>('active');
  const [toast, setToast] = useState<string | null>(null);
  const gridRef = useRef<GridComponent | null>(null);

  const onToolbarClick = (args: { item?: { id?: string } }) => {
    if (args.item?.id?.endsWith('_excelexport')) gridRef.current?.excelExport();
  };

  const data = medsQ.data?.data;

  if (medsQ.loading) return <LoadingState inline label="Loading medications…" />;
  if (medsQ.error) return <ErrorBanner message={medsQ.error} onRetry={medsQ.refresh} />;
  if (!data) return <EmptyState title="No medications" description="No medication records found for this patient." />;

  const adherenceColor = data.adherencePct >= 80
    ? 'var(--color-sf-fg-success-primary)'
    : data.adherencePct >= 50
      ? 'var(--color-sf-fg-warning-primary)'
      : 'var(--color-sf-fg-error-primary)';

  const onSubTabSelecting = (e: { selectingIndex: number }) => {
    const keys: ('active' | 'history' | 'refills')[] = ['active', 'history', 'refills'];
    if (e.selectingIndex >= 0 && e.selectingIndex < keys.length) setSubTab(keys[e.selectingIndex]);
  };

  const requestRefill = (m: MedicationDto) => {
    setToast(`Refill request submitted for ${m.medicationName} (${m.dosage}).`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'var(--color-sf-bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--color-sf-border-secondary)' }}>
        <div style={{ width: 120, height: 120 }}>
          <ProgressBarComponent
            value={data.adherencePct}
            minimum={0}
            maximum={100}
            width="120"
            height="120"
            type="Circular"
            trackThickness={10}
            progressThickness={10}
            cornerRadius="Round"
            progressColor={adherenceColor}
            labelStyle={{ color: 'var(--color-sf-fg-primary)', fontWeight: '700' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--color-sf-fg-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Adherence (last 90 days)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: adherenceColor }}>{data.adherencePct.toFixed(1)}%</div>
          <div style={{ fontSize: 12, color: 'var(--color-sf-fg-quinary)', marginTop: 4 }}>
            {data.adherencePct >= 80 ? 'On track' : data.adherencePct >= 50 ? 'Monitor — below target' : 'Outreach recommended'}
          </div>
        </div>
      </div>

      
      <TabComponent heightAdjustMode="Auto" selecting={onSubTabSelecting}>
        <TabItemsDirective>
          <TabItemDirective header={{ text: `Active (${data.active.length})` }} />
          <TabItemDirective header={{ text: `History (${data.history.length})` }} />
          <TabItemDirective header={{ text: `Refills (${data.recentRefills.length})` }} />
        </TabItemsDirective>
      </TabComponent>

      {subTab === 'active' && (
        data.active.length === 0 ? (
          <EmptyState title="No active medications" description="This patient has no active prescriptions." />
        ) : (
          <GridComponent ref={gridRef} dataSource={data.active as unknown as { [key: string]: object }[]} allowPaging pageSettings={{ pageSize: 10 }} allowSorting allowExcelExport toolbar={['ExcelExport']} toolbarClick={onToolbarClick}>
            <ColumnsDirective>
              <ColumnDirective field="medicationName" headerText="Medication" width="160" />
              <ColumnDirective field="dosage" headerText="Dosage" width="100" />
              <ColumnDirective field="frequency" headerText="Frequency" width="130" />
              <ColumnDirective field="route" headerText="Route" width="100" />
              <ColumnDirective field="prescriberName" headerText="Prescriber" width="160" />
              <ColumnDirective field="startDate" headerText="Started" width="120" template={(p: MedicationDto) => <>{fmtDate(p.startDate)}</>} />
              <ColumnDirective field="refillsRemaining" headerText="Refills Left" width="110" />
              <ColumnDirective field="pharmacy" headerText="Pharmacy" width="140" />
              <ColumnDirective field="status" headerText="Status" width="110" template={(p: MedicationDto) => <StatusBadge status={p.status} />} />
              <ColumnDirective
                headerText="Action"
                width="140"
                template={(p: MedicationDto) => (
                  <ButtonComponent cssClass="e-info e-small e-outline" onClick={() => requestRefill(p)}>Request Refill</ButtonComponent>
                )}
              />
            </ColumnsDirective>
            <Inject services={[Page, Sort, Toolbar, ExcelExport]} />
          </GridComponent>
        )
      )}

      {subTab === 'history' && (
        data.history.length === 0 ? (
          <EmptyState title="No medication history" />
        ) : (
          <GridComponent dataSource={data.history as unknown as { [key: string]: object }[]} allowPaging pageSettings={{ pageSize: 10 }} allowSorting>
            <ColumnsDirective>
              <ColumnDirective field="medicationName" headerText="Medication" width="160" />
              <ColumnDirective field="dosage" headerText="Dosage" width="100" />
              <ColumnDirective field="frequency" headerText="Frequency" width="130" />
              <ColumnDirective field="startDate" headerText="Started" width="120" template={(p: MedicationDto) => <>{fmtDate(p.startDate)}</>} />
              <ColumnDirective field="endDate" headerText="Stopped" width="120" template={(p: MedicationDto) => <>{fmtDate(p.endDate)}</>} />
              <ColumnDirective field="stopReason" headerText="Stop Reason" width="180" />
              <ColumnDirective field="prescriberName" headerText="Prescriber" width="160" />
              <ColumnDirective field="status" headerText="Status" width="120" template={(p: MedicationDto) => <StatusBadge status={p.status} />} />
            </ColumnsDirective>
            <Inject services={[Page, Sort]} />
          </GridComponent>
        )
      )}

      {subTab === 'refills' && (
        data.recentRefills.length === 0 ? (
          <EmptyState title="No refill history" />
        ) : (
          <GridComponent dataSource={data.recentRefills as unknown as { [key: string]: object }[]} allowPaging pageSettings={{ pageSize: 10 }} allowSorting>
            <ColumnsDirective>
              <ColumnDirective field="medicationName" headerText="Medication" width="180" />
              <ColumnDirective field="refillDate" headerText="Refill Date" width="150" template={(p: MedicationRefillDto) => <>{fmtDate(p.refillDate)}</>} />
              <ColumnDirective field="status" headerText="Status" width="120" template={(p: MedicationDto) => <StatusBadge status={p.status} />} />
            </ColumnsDirective>
            <Inject services={[Page, Sort]} />
          </GridComponent>
        )
      )}

      {toast && (
        <div style={{
          position: 'sticky',
          bottom: 16,
          background: 'var(--color-sf-bg-success-solid)',
          color: 'var(--color-sf-fg-white)',
          padding: '10px 16px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          boxShadow: 'var(--shadow-md)',
          alignSelf: 'flex-end',
        }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
};
