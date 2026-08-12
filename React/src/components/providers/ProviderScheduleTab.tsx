import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Day,
  Week,
  Month,
  Inject,
  EventSettingsModel,
  EventRenderedArgs,
} from '@syncfusion/ej2-react-schedule';
import { ScheduleErrorBoundary } from '@components/shared/ScheduleErrorBoundary';
import { LoadingState } from '@components/shared/LoadingState';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { getAppointmentColor, chooseTextColor } from '../../utils/appointmentColors';
import type { AppointmentSummaryDto } from '@models/dtos';

interface ScheduleEvent {
  Id: string;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  Status: string;
  CategoryColor: string;
}

export interface ProviderScheduleTabProps {
  appointments: AppointmentSummaryDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedDate: Date;
}

const card: React.CSSProperties = {
  background: 'var(--color-sf-bg-primary)',
  borderRadius: 8,
  padding: 20,
  boxShadow: 'var(--shadow-default)',
};

export const ProviderScheduleTab: React.FC<ProviderScheduleTabProps> = ({ appointments, loading, error, onRetry, selectedDate }) => {
  const scheduleRef = useRef<ScheduleComponent>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const events: ScheduleEvent[] = useMemo(
    () =>
      appointments.map((a) => ({
        Id: a.appointmentId,
        Subject: `${a.patientName} — ${a.appointmentType}`,
        StartTime: new Date(a.scheduledDateTime),
        EndTime: new Date(new Date(a.scheduledDateTime).getTime() + a.durationMinutes * 60000),
        Status: a.status,
        CategoryColor: getAppointmentColor(a.appointmentType),
      })),
    [appointments]
  );

  
  useEffect(() => {
    if (scheduleRef.current && events.length > 0) {
      scheduleRef.current.refreshEvents();
    }
  }, [events]);

  const eventSettings: EventSettingsModel = useMemo(
    () => ({
      dataSource: events,
      fields: {
        id: 'Id',
        subject: { name: 'Subject' },
        startTime: { name: 'StartTime' },
        endTime: { name: 'EndTime' },
      },
    }),
    [events]
  );

  const onEventRendered = (args: EventRenderedArgs) => {
    const data = args.data as ScheduleEvent;
    const bg = data?.CategoryColor;
    if (!bg || !args.element) return;
    args.element.style.backgroundColor = bg;
    args.element.style.color = chooseTextColor(bg);
    args.element.style.borderColor = bg;
    args.element.querySelectorAll<HTMLElement>('.e-subject, .e-time, .e-date-time').forEach((node) => {
      node.style.color = 'inherit';
    });
  };

  if (loading) return <LoadingState label="Loading appointments…" />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div style={{ ...card, height: 620, display: 'flex', flexDirection: 'column' }}>
      <ScheduleErrorBoundary onRetry={onRetry}>
        <ScheduleComponent
          ref={scheduleRef}
          height="100%"
          selectedDate={selectedDate}
          currentView="Week"
          timezone="UTC"
          startHour="08:00"
          endHour="18:00"
          readonly
          enableAdaptiveUI={isMobile}
          eventSettings={eventSettings}
          eventRendered={onEventRendered}
        >
          <ViewsDirective>
            <ViewDirective option="Day" />
            <ViewDirective option="Week" />
            <ViewDirective option="Month" />
          </ViewsDirective>
          <Inject services={[Day, Week, Month]} />
        </ScheduleComponent>
      </ScheduleErrorBoundary>
    </div>
  );
};
