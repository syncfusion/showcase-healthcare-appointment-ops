import React, { useEffect, useMemo, useState } from 'react';
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import { DropDownListComponent, ChangeEventArgs as DropDownChangeArgs } from '@syncfusion/ej2-react-dropdowns';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { StatusBadge } from '@components/shared/StatusBadge';
import { LoadingState } from '@components/shared/LoadingState';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import {
  getAppointment,
  transitionAppointmentStatus,
  cancelAppointment,
  checkInAppointment,
  noShowAppointment,
  listAuditLog,
} from '@services/healthcare.service';
import type {
  AppointmentDetailDto,
  AppointmentStatus,
  AuditLogEntryDto,
} from '@models/dtos';

export interface AppointmentDetailPanelProps {
  isOpen: boolean;
  appointmentId?: string;
  onClose: () => void;
  onChanged?: () => void;
}

const STATUS_WORKFLOW: AppointmentStatus[] = [
  'Scheduled',
  'Confirmed',
  'CheckedIn',
  'InProgress',
  'Completed',
];

const TERMINAL_STATUSES: AppointmentStatus[] = ['Completed', 'Cancelled', 'NoShow'];

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export const AppointmentDetailPanel: React.FC<AppointmentDetailPanelProps> = ({
  isOpen,
  appointmentId,
  onClose,
  onChanged,
}) => {
  const isMobile = useIsMobile();
  const [detail, setDetail] = useState<AppointmentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [audit, setAudit] = useState<AuditLogEntryDto[]>([]);
  const [confirm, setConfirm] = useState<null | 'cancel' | 'noshow'>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadDetail = React.useCallback(async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const [d, a] = await Promise.all([
        getAppointment(id),
        listAuditLog('Appointment', id, 0, 5),
      ]);
      if (d.status === 'ok' && d.data) {
        setDetail(d.data);
      } else {
        setError(d.error?.detail ?? 'Failed to load appointment');
        setDetail(null);
      }
      setAudit(a.data?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load appointment');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && appointmentId) {
      loadDetail(appointmentId);
      setCancelReason('');
    } else if (!isOpen) {
      setDetail(null);
      setAudit([]);
      setError('');
      setConfirm(null);
      setCancelReason('');
    }
  }, [isOpen, appointmentId, loadDetail]);

  const refreshAfterChange = React.useCallback(async () => {
    if (appointmentId) {
      await loadDetail(appointmentId);
      onChanged?.();
    }
  }, [appointmentId, loadDetail, onChanged]);

  const currentStatus = detail?.status;
  const isTerminal = !!currentStatus && TERMINAL_STATUSES.includes(currentStatus);

  const statusItems = useMemo(() => {
    if (!currentStatus) return [];
    const items: AppointmentStatus[] = [];
    STATUS_WORKFLOW.forEach((s) => {
      if (s !== currentStatus) items.push(s);
    });
    if (currentStatus !== 'Cancelled') items.push('Cancelled' as AppointmentStatus);
    if (currentStatus !== 'NoShow') items.push('NoShow' as AppointmentStatus);
    return items;
  }, [currentStatus]);

  const handleStatusChange = (args: DropDownChangeArgs) => {
    const next = args.value as AppointmentStatus | null;
    if (!next || !detail) return;
    if (next === 'Cancelled') {
      setConfirm('cancel');
      return;
    }
    if (next === 'NoShow') {
      setConfirm('noshow');
      return;
    }
    transitionAppointmentStatus(detail.appointmentId, { status: next })
      .then((res) => {
        if (res.status === 'ok' && res.data) setDetail(res.data);
        return refreshAfterChange();
      })
      .catch(() => setError('Status transition failed'));
  };

  const handleCheckIn = () => {
    if (!detail) return;
    checkInAppointment(detail.appointmentId, 'FrontDesk')
      .then((res) => {
        if (res.status === 'ok' && res.data) setDetail(res.data);
        return refreshAfterChange();
      })
      .catch(() => setError('Check-in failed'));
  };

  const handleEdit = () => {
    
    
    
    console.info('Edit appointment', detail?.appointmentId);
  };

  const runCancel = () => {
    if (!detail) return;
    cancelAppointment(detail.appointmentId, cancelReason)
      .then((res) => {
        if (res.status === 'ok' && res.data) setDetail(res.data);
        setConfirm(null);
        setCancelReason('');
        return refreshAfterChange();
      })
      .catch(() => setError('Cancel failed'));
  };

  const runNoShow = () => {
    if (!detail) return;
    noShowAppointment(detail.appointmentId)
      .then((res) => {
        if (res.status === 'ok' && res.data) setDetail(res.data);
        setConfirm(null);
        return refreshAfterChange();
      })
      .catch(() => setError('No-Show failed'));
  };

  const sidebarWidth = isMobile ? '100%' : '420px';

  const renderBody = () => {
    if (loading) {
      return <LoadingState label="Loading appointment…" />;
    }
    if (error) {
      return (
        <div style={{ padding: 16 }}>
          <ErrorBanner message={error} onRetry={() => appointmentId && loadDetail(appointmentId)} />
        </div>
      );
    }
    if (!detail) {
      return <div style={{ padding: 24, color: 'var(--color-sf-fg-tertiary)' }}>No appointment selected.</div>;
    }

    const end = new Date(
      new Date(detail.scheduledDateTime).getTime() + detail.durationMinutes * 60000
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px 0' }}>
          <ButtonComponent cssClass="e-flat e-small" onClick={onClose} title="Close">
            ✕
          </ButtonComponent>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, overflow: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusBadge status={detail.status} />
          <div style={{ display: 'flex', gap: 8 }}>
            <ButtonComponent cssClass="e-outline e-small" onClick={handleEdit}>
              Edit
            </ButtonComponent>
            {!isTerminal && (
              <>
                <ButtonComponent cssClass="e-info e-small" onClick={handleCheckIn}>
                  Check In
                </ButtonComponent>
                <ButtonComponent cssClass="e-danger e-small e-outline" onClick={() => setConfirm('cancel')}>
                  Cancel
                </ButtonComponent>
                <ButtonComponent cssClass="e-warning e-small e-outline" onClick={() => setConfirm('noshow')}>
                  Mark No-Show
                </ButtonComponent>
              </>
            )}
          </div>
        </div>

        
        <div>
          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>
            Status
          </label>
          <DropDownListComponent
            dataSource={statusItems as any}
            placeholder={`Change from ${detail.status}`}
            change={handleStatusChange}
            value={null as any}
            sortOrder="Ascending"
            cssClass="e-outline"
          />
        </div>

        
        <Section title="Patient">
          <Row label="Name" value={detail.patientName} />
          <Row label="MRN" value={detail.patientMrn} />
        </Section>

        
        <Section title="Provider">
          <Row label="Name" value={detail.providerName} />
          <Row label="Specialty" value={detail.providerSpecialty} />
          <Row label="Department" value={detail.departmentName} />
        </Section>

        
        <Section title="Timing">
          <Row label="Scheduled" value={new Date(detail.scheduledDateTime).toLocaleString('en-US')} />
          <Row label="Duration" value={`${detail.durationMinutes} min`} />
          <Row label="End" value={end.toLocaleString('en-US')} />
          {detail.checkedInDateTime && (
            <Row label="Checked In" value={new Date(detail.checkedInDateTime).toLocaleString('en-US')} />
          )}
          {detail.completedDateTime && (
            <Row label="Completed" value={new Date(detail.completedDateTime).toLocaleString('en-US')} />
          )}
        </Section>

        
        <Section title="Notes">
          <Row label="Reason for Visit" value={detail.reasonForVisit} />
          <Row label="Notes" value={detail.notes || '—'} />
          <Row label="Patient Instructions" value={detail.patientInstructions || '—'} />
          {detail.cancellationReason && (
            <Row label="Cancellation Reason" value={detail.cancellationReason} />
          )}
        </Section>

        
        <Section title="Audit Trail (last 5)">
          {audit.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>No audit entries.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {audit.map((entry) => (
                <li key={entry.auditId} style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600 }}>{entry.action}</div>
                  <div style={{ color: 'var(--color-sf-fg-tertiary)' }}>
                    by {entry.performedBy} · {new Date(entry.performedAt).toLocaleString('en-US')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
        </div>
      </div>
    );
  };

  return (
    <>
      
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-sf-utility-overlay-bg-color)',
            zIndex: 999,
          }}
        />
      )}
      <SidebarComponent
        isOpen={isOpen}
        position="Right"
        type="Over"
        width={sidebarWidth}
        closeOnDocumentClick={false}
        close={onClose}
        style={{ zIndex: 1000 }}
      >
        {renderBody()}
      </SidebarComponent>

      
      {confirm === 'cancel' && detail && (
        <DialogComponent
          header="Cancel Appointment"
          isModal
          showCloseIcon
          width="420px"
          close={() => setConfirm(null)}
          buttons={[
            {
              click: runCancel,
              buttonModel: {
                content: 'Confirm Cancel',
                cssClass: 'e-danger',
                isPrimary: true,
                disabled: !cancelReason.trim(),
              },
            },
            {
              click: () => setConfirm(null),
              buttonModel: { content: 'Keep Appointment', cssClass: 'e-flat' },
            },
          ]}
        >
          <p style={{ fontSize: 13 }}>Please provide a cancellation reason (required):</p>
          <TextBoxComponent
            placeholder="Cancellation reason"
            value={cancelReason}
            change={(e: { value?: string }) => setCancelReason(e.value ?? '')}
            multiline
          />
        </DialogComponent>
      )}

      {confirm === 'noshow' && detail && (
        <DialogComponent
          header="Mark No-Show"
          isModal
          showCloseIcon
          width="420px"
          close={() => setConfirm(null)}
          buttons={[
            {
              click: runNoShow,
              buttonModel: {
                content: 'Confirm No-Show',
                cssClass: 'e-warning',
                isPrimary: true,
              },
            },
            {
              click: () => setConfirm(null),
              buttonModel: { content: 'Dismiss', cssClass: 'e-flat' },
            },
          ]}
        >
          <p style={{ fontSize: 13 }}>
            Mark this appointment as No-Show for {detail.patientName}?
          </p>
        </DialogComponent>
      )}
    </>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div
    style={{
      border: '1px solid var(--color-sf-border-secondary)',
      borderRadius: 6,
      padding: 12,
      background: 'var(--color-sf-bg-secondary)',
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{title}</div>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', fontSize: 12, marginBottom: 4 }}>
    <div style={{ width: 140, color: 'var(--color-sf-fg-tertiary)' }}>{label}</div>
    <div style={{ flex: 1, fontWeight: 500 }}>{value}</div>
  </div>
);
