import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  ResourcesDirective,
  ResourceDirective,
  Day,
  Week,
  WorkWeek,
  Month,
  Inject,
  Resize,
  DragAndDrop,
  ActionEventArgs,
  EventSettingsModel,
  CellClickEventArgs,
  EventClickArgs,
  NavigatingEventArgs,
  EventRenderedArgs,
  Agenda,
  TimelineViews,
} from '@syncfusion/ej2-react-schedule';
import { DropDownListComponent, ChangeEventArgs as DropDownChangeArgs } from '@syncfusion/ej2-react-dropdowns';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { useAsyncResult } from '@hooks/useAsyncResult';
import {
  listAppointments,
  createAppointment,
  listProviders,
  listDepartments,
} from '@services/healthcare.service';
import { withDepartmentLabel } from '../utils/department';
import { NewAppointmentDialog } from '@components/appointments/NewAppointmentDialog';
import { AppointmentDetailPanel } from '@components/appointments/AppointmentDetailPanel';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';
import { ScheduleErrorBoundary } from '@components/shared/ScheduleErrorBoundary';
import { APPOINTMENT_TYPE_COLORS, getAppointmentColor, chooseTextColor } from '../utils/appointmentColors';
import type { AppointmentSummaryDto, CreateAppointmentRequest } from '@models/dtos';

interface ScheduleEvent {
  Id: string;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  ProviderId: string;
  ResourceId: string;
  ProviderName: string;
  PatientName: string;
  Status: string;
  IsReadonly: boolean;
  AppointmentType: string;
  CategoryColor: string;
}

export const SchedulePage: React.FC = () => {
  const scheduleRef = useRef<ScheduleComponent>(null);
  const deptDdlRef = useRef<DropDownListComponent>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<string>('Day');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogDateTime, setDialogDateTime] = useState<Date | undefined>(undefined);
  const [dialogProviderId, setDialogProviderId] = useState<string | undefined>(undefined);
  const [refreshTick, setRefreshTick] = useState(0);
  const [detailPanel, setDetailPanel] = useState<{ open: boolean; appointmentId?: string }>({ open: false });

  const apptsQuery = useAsyncResult(() => {
    const [rangeStart, rangeEnd] = computeVisibleRange(selectedDate, currentView);
    const params: Record<string, string> = { dateFrom: formatDate(rangeStart), dateTo: formatEndOfDay(rangeEnd), limit: '500' };
    if (departmentFilter) params.departmentId = departmentFilter;
    if (providerFilter) params.providerId = providerFilter;
    return listAppointments(params);
  }, [selectedDate, currentView, departmentFilter, providerFilter, refreshTick]);
  const providersQuery = useAsyncResult(() => listProviders(departmentFilter || undefined), [departmentFilter]);
  const departmentsQuery = useAsyncResult(() => listDepartments(), []);

  
  
  useEffect(() => {
    const depts = departmentsQuery.data?.data ?? [];
    if (!departmentFilter && depts.length > 0) {
      setDepartmentFilter(depts[0].departmentId);
    }
  }, [departmentsQuery.data, departmentFilter]);

  const events: ScheduleEvent[] = useMemo(() => {
    const items = apptsQuery.data?.data?.items;
    if (!items) {
      if (apptsQuery.data) {
        
        console.warn('[SchedulePage] listAppointments returned no items', apptsQuery.data);
      }
      return [];
    }
    return items.map((a: AppointmentSummaryDto) => {
      const color = getAppointmentColor(a.appointmentType);
      if (!APPOINTMENT_TYPE_COLORS[a.appointmentType]) {
        
        console.warn(`[SchedulePage] Unmapped appointment type "${a.appointmentType}" — falling back to neutral color.`);
      }
      return {
        Id: a.appointmentId,
        Subject: `${a.patientName} — ${a.appointmentType}`,
        StartTime: new Date(a.scheduledDateTime),
        EndTime: new Date(new Date(a.scheduledDateTime).getTime() + a.durationMinutes * 60000),
        ProviderId: a.providerId ?? providerFilter,
        ResourceId: a.providerId ?? providerFilter,
        ProviderName: a.providerName,
        PatientName: a.patientName,
        Status: a.status,
        IsReadonly: ['Completed', 'Cancelled', 'NoShow'].includes(a.status),
        AppointmentType: a.appointmentType,
        CategoryColor: color,
      };
    });
  }, [apptsQuery.data, providerFilter]);

  
  useEffect(() => {
    if (scheduleRef.current && events.length > 0) {
      scheduleRef.current.refreshEvents();
    }
  }, [events]);

  const eventSettings: EventSettingsModel = useMemo(() => ({
    dataSource: events,
    fields: {
      id: 'Id',
      subject: { name: 'Subject' },
      startTime: { name: 'StartTime' },
      endTime: { name: 'EndTime' },
    },
  }), [events]);

  
  
  
  
  
  const departmentOptions = useMemo(
    () => withDepartmentLabel(departmentsQuery.data?.data ?? []),
    [departmentsQuery.data]
  );

  
  
  
  
  
  
  
  useEffect(() => {
    const ddl = deptDdlRef.current;
    if (!ddl || departmentOptions.length === 0) return;
    const next = departmentFilter || null;
    if (ddl.value !== next) {
      ddl.value = next;
    }
  }, [departmentFilter, departmentOptions]);

  const filteredProviders = useMemo(() => {
    const all = providersQuery.data?.data?.items ?? [];
    if (departmentFilter) return all.filter((p) => p.departmentId === departmentFilter);
    return all;
  }, [providersQuery.data, departmentFilter]);

  const resourceDataSource = useMemo(() => {
    return filteredProviders.map((p) => ({
      text: `Dr. ${p.firstName} ${p.lastName}`,
      id: p.providerId,
    }));
  }, [filteredProviders]);

  
  
  
  
  
  
  
  const group = useMemo(() => {
    if (providerFilter || !departmentFilter || resourceDataSource.length === 0) return undefined;
    return {
      byDate: true,
      resources: ['Providers'],
    };
  }, [providerFilter, departmentFilter, resourceDataSource]);





  const scheduleKey = useMemo(
    () => `${group ? 'grouped' : 'flat'}|${resourceDataSource.map((r) => r.id).join(',')}`,
    [group, resourceDataSource]
  );

  const handleOpenNewAppointment = useCallback(
    (initialDateTime?: Date, initialProviderId?: string) => {
      setDialogDateTime(initialDateTime);
      setDialogProviderId(initialProviderId ?? (providerFilter || undefined));
      setDialogVisible(true);
    },
    [providerFilter]
  );

  const openDetailPanel = useCallback((appointmentId: string) => {
    setDetailPanel({ open: true, appointmentId });
  }, []);

  const closeDetailPanel = useCallback(() => {
    setDetailPanel({ open: false });
  }, []);

  const onCellDoubleClick = useCallback(
    (args: CellClickEventArgs) => {
      args.cancel = true;
      const resourceId = (args as any).groupIndex !== undefined
        ? resourceDataSource[(args as any).groupIndex]?.id
        : undefined;
      handleOpenNewAppointment(args.startTime as Date, resourceId ?? undefined);
    },
    [handleOpenNewAppointment, resourceDataSource]
  );

  const onEventClick = useCallback(
    (args: EventClickArgs) => {
      
      
      args.cancel = true;
      const id = (args.event as any)?.Id as string | undefined;
      if (id) openDetailPanel(id);
    },
    [openDetailPanel]
  );

  const onEventDoubleClick = useCallback(
    (args: EventClickArgs) => {
      args.cancel = true;
      const id = (args.event as any)?.Id as string | undefined;
      if (id) openDetailPanel(id);
    },
    [openDetailPanel]
  );

  const onNavigating = useCallback((args: NavigatingEventArgs) => {
    if (args.action === 'date' && args.currentDate) {
      setSelectedDate(new Date(args.currentDate as Date));
    } else if (args.action === 'view' && args.currentView) {
      setCurrentView(args.currentView as string);
    }
  }, []);

  const onEventRendered = useCallback((args: EventRenderedArgs) => {
    const data = args.data as ScheduleEvent;
    const bg = data?.CategoryColor;
    if (!bg || !args.element) return;

    const text = chooseTextColor(bg);
    args.element.style.backgroundColor = bg;
    args.element.style.color = text;
    args.element.style.borderColor = bg;

    
    
    const textNodes = args.element.querySelectorAll<HTMLElement>('.e-subject, .e-time, .e-date-time');
    textNodes.forEach((node) => {
      node.style.color = 'inherit';
    });
  }, []);

  const onActionComplete = useCallback((args: ActionEventArgs) => {
    if (args.requestType === 'eventCreated' && args.data && !Array.isArray(args.data)) {
      const ev = args.data as ScheduleEvent;
      setDialogDateTime(ev.StartTime);
      setDialogProviderId(ev.ProviderId);
      setDialogVisible(true);
    }
    if (args.requestType === 'eventChanged' || args.requestType === 'eventRemoved') {
      setRefreshTick((t) => t + 1);
    }
  }, []);

  const handleDialogSubmit = async (req: CreateAppointmentRequest) => {
    const res = await createAppointment(req);
    if (res.status === 'ok') {
      setDialogVisible(false);
      setRefreshTick((t) => t + 1);
    } else {
      alert(res.error?.detail ?? 'Failed to book appointment');
    }
  };

  
  
  
  const dataError = apptsQuery.error || providersQuery.error || departmentsQuery.error || null;

  
  
  
  
  
  
  const allDataReady =
    (!!apptsQuery.data || !!apptsQuery.error) &&
    (!!providersQuery.data || !!providersQuery.error) &&
    (!!departmentsQuery.data || !!departmentsQuery.error);

  const scheduleLoading = !allDataReady;

  const refreshAll = useCallback(() => {
    apptsQuery.refresh();
    providersQuery.refresh();
    departmentsQuery.refresh();
  }, [apptsQuery, providersQuery, departmentsQuery]);

  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <DropDownListComponent
            ref={deptDdlRef}
            cssClass="dept-group-ddl"
            dataSource={departmentOptions as any}
            fields={{ text: 'departmentName', value: 'departmentId', groupBy: 'locationName' }}
            sortOrder="Ascending"
            showClearButton
            placeholder="All Departments"
            change={(e: DropDownChangeArgs) => {
              setDepartmentFilter((e.value as string) ?? '');
              setProviderFilter('');
            }}
            value={departmentFilter}
            allowFiltering
            width="200px"
          />
          <DropDownListComponent
            dataSource={filteredProviders as any}
            fields={{ text: 'lastName', value: 'providerId' }}
            sortOrder="Ascending"
            showClearButton
            placeholder="All Providers"
            change={(e: DropDownChangeArgs) => setProviderFilter((e.value as string) ?? '')}
            value={providerFilter}
            allowFiltering
            width="200px"
          />
          <ButtonComponent
            cssClass="e-primary"
            iconCss="e-icons e-plus"
            onClick={() => handleOpenNewAppointment()}
          >
            New Appointment
          </ButtonComponent>
        </div>
      </div>

      {dataError && (
        <ErrorBanner
          title="Schedule data could not be loaded"
          message="Schedule data could not be loaded — showing an empty planner. Click Retry to attempt loading again."
          onRetry={refreshAll}
        />
      )}

      {scheduleLoading ? (
        <LoadingState label="Loading schedule…" />
      ) : dataError ? (
        
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-sf-bg-secondary)', borderTop: '1px solid var(--color-sf-border-secondary)' }}>
          <EmptyState title="Empty schedule" description="No events to display." />
        </div>
      ) : (
        
        
        <ScheduleErrorBoundary onRetry={refreshAll}>
          <ScheduleComponent
            key={scheduleKey}
            ref={scheduleRef}
            height="100%"
            selectedDate={selectedDate}
            currentView="WorkWeek"
            showQuickInfo={false}
            enableAdaptiveUI={isMobile}
            startHour="08:00"
            endHour="18:00"
            workHours={{ highlight: true, start: '08:00', end: '17:00' }}
            eventSettings={dataError ? { dataSource: [] } : eventSettings}
            actionComplete={onActionComplete}
            cellDoubleClick={onCellDoubleClick}
            eventClick={onEventClick}
            eventDoubleClick={onEventDoubleClick}
            navigating={onNavigating}
            eventRendered={onEventRendered}
            group={group}
            timezone="UTC"
          >
            <ViewsDirective>
              <ViewDirective option="Day" />
              <ViewDirective option="WorkWeek" />
              <ViewDirective option="Month" />
              <ViewDirective option="Agenda" />
              <ViewDirective option="TimelineWeek" />
            </ViewsDirective>
             <ResourcesDirective>
              <ResourceDirective
                field="ProviderId"
                title="Provider"
                name="Providers"
                dataSource={resourceDataSource as any}
                textField="text"
                idField="id"
                allowMultiple={false}
              />
            </ResourcesDirective>
            <Inject services={[Day, Week, WorkWeek, Month, Agenda, TimelineViews, Resize, DragAndDrop]} />
          </ScheduleComponent>
        </ScheduleErrorBoundary>
      )}

      
      {dialogVisible && (
        <NewAppointmentDialog
          visible={dialogVisible}
          initialDateTime={dialogDateTime}
          initialProviderId={dialogProviderId}
          providers={filteredProviders}
          departments={departmentsQuery.data?.data ?? []}
          onClose={() => setDialogVisible(false)}
          onSubmit={handleDialogSubmit}
          loading={false}
        />
      )}

      {detailPanel.open && (
        <AppointmentDetailPanel
          isOpen={detailPanel.open}
          appointmentId={detailPanel.appointmentId}
          onClose={closeDetailPanel}
          onChanged={() => setRefreshTick((t) => t + 1)}
        />
      )}
    </div>
  );
};

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatEndOfDay(d: Date) {
  
  
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return end.toISOString();
}

function computeVisibleRange(anchor: Date, view: string): [Date, Date] {
  if (view === 'Month') {
    const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - 7);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    end.setDate(end.getDate() + 7);
    return [start, end];
  }
  return [startOfWeek(anchor), endOfWeek(anchor)];
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}

function endOfWeek(d: Date) {
  const start = startOfWeek(d);
  return new Date(start.getTime() + 6 * 86400000);
}
