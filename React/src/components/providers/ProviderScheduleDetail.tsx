import React from 'react';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Sort,
} from '@syncfusion/ej2-react-grids';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { getProviderTemplates } from '@services/healthcare.service';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';
import { DAY_LABELS, formatTime12h, sortTemplates } from '../../utils/schedule';
import { fmtDate } from '../../utils/dateFormat';

export interface ProviderScheduleDetailProps {
  providerId: string;
}

export const ProviderScheduleDetail: React.FC<ProviderScheduleDetailProps> = ({ providerId }) => {
  const templatesQuery = useAsyncResult(() => getProviderTemplates(providerId), [providerId]);
  const templates = sortTemplates(templatesQuery.data?.data ?? []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--color-sf-fg-secondary)' }}>Weekly Availability</div>
      <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)', marginBottom: 12 }}>Recurring schedule templates for this provider.</div>
      {templatesQuery.loading && !templatesQuery.data ? (
        <LoadingState inline label="Loading templates…" />
      ) : templates.length === 0 ? (
        <EmptyState title="No templates" description="This provider has no schedule templates yet." />
      ) : (
        <GridComponent dataSource={templates} allowSorting>
          <ColumnsDirective>
            <ColumnDirective field="dayOfWeek" headerText="Day" width="90" template={(props: any) => DAY_LABELS[props.dayOfWeek]} />
            <ColumnDirective field="startTime" headerText="Start" width="100" template={(props: any) => formatTime12h(props.startTime)} />
            <ColumnDirective field="endTime" headerText="End" width="100" template={(props: any) => formatTime12h(props.endTime)} />
            <ColumnDirective field="slotDuration" headerText="Slot (min)" width="100" />
            <ColumnDirective field="effectiveFrom" headerText="From" width="120" template={(props: any) => fmtDate(props.effectiveFrom)} />
            <ColumnDirective field="effectiveTo" headerText="To" width="120" template={(props: any) => (props.effectiveTo ? fmtDate(props.effectiveTo) : 'Ongoing')} />
            <ColumnDirective field="isActive" headerText="Active" width="90" displayAsCheckBox />
          </ColumnsDirective>
          <Inject services={[Sort]} />
        </GridComponent>
      )}
    </div>
  );
};
