import React from 'react';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { StatusBadge } from '@components/shared/StatusBadge';
import type { WaitlistEntryDto } from '@models/dtos';
import { fmtDate } from '../../utils/dateFormat';

export interface WaitlistEntryDetailProps {
  entry: WaitlistEntryDto;
  onClose: () => void;
  onFindSlot: () => void;
  onRemove: () => void;
  removing?: boolean;
}

const urgencyWeight: Record<WaitlistEntryDto['urgencyLevel'], number> = {
  Routine: 33,
  Urgent: 66,
  Emergency: 100,
};

function daysSince(value: string): number {
  const d = new Date(value);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--color-sf-border-tertiary)' }}>
    <span style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-sf-fg-secondary)', textAlign: 'right' }}>{value}</span>
  </div>
);

const FactorBar: React.FC<{ label: string; percent: number; caption: string; color: string }> = ({ label, percent, caption, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-sf-fg-tertiary)', marginBottom: 4 }}>
      <span>{label}</span>
      <span>{caption}</span>
    </div>
    <div style={{ height: 8, background: 'var(--color-sf-bg-tertiary)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, percent))}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  </div>
);

export const WaitlistEntryDetail: React.FC<WaitlistEntryDetailProps> = ({ entry, onClose, onFindSlot, onRemove, removing }) => {
  const waitDays = daysSince(entry.requestDateTime);
  const urgencyPct = urgencyWeight[entry.urgencyLevel] ?? 33;
  const waitPct = Math.min(100, (waitDays / 30) * 100);
  const isOpen = entry.status === 'Open';

  return (
    <div
      style={{
        width: 360,
        background: 'var(--color-sf-bg-primary)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-sf-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-sf-fg-primary)' }}>{entry.patientName}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <StatusBadge status={entry.urgencyLevel} />
            <StatusBadge status={entry.status} />
          </div>
        </div>
        <ButtonComponent cssClass="e-flat e-small" iconCss="e-icons e-close" onClick={onClose} title="Close" />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-sf-fg-quinary)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
          Request
        </div>
        <Row label="Appointment type" value={entry.requestedAppointmentType} />
        <Row label="Preferred provider" value={entry.preferredProviderName ?? 'Any available'} />
        <Row label="Department" value={entry.preferredDepartmentName} />
        <Row label="Preferred dates" value={`${fmtDate(entry.preferredDateRangeStart)} – ${fmtDate(entry.preferredDateRangeEnd)}`} />
        <Row label="Requested on" value={`${fmtDate(entry.requestDateTime)} (${waitDays}d ago)`} />

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-sf-fg-quinary)', textTransform: 'uppercase', letterSpacing: 0.4, margin: '18px 0 10px' }}>
          Priority breakdown
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-sf-fg-brand-primary)', lineHeight: 1 }}>{entry.priorityScore}</span>
          <span style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>composite priority score</span>
        </div>
        <FactorBar label="Urgency" percent={urgencyPct} caption={entry.urgencyLevel} color="var(--color-sf-bg-warning-solid)" />
        <FactorBar label="Wait time" percent={waitPct} caption={`${waitDays} day${waitDays === 1 ? '' : 's'}`} color="var(--color-sf-bg-brand-solid)" />
        {entry.matchedAppointmentId && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-sf-fg-success-primary)', background: 'var(--color-sf-bg-success-primary)', borderRadius: 6, padding: '6px 10px' }}>
            Matched to appointment {entry.matchedAppointmentId}
          </div>
        )}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--color-sf-border-secondary)', display: 'flex', gap: 8 }}>
        <ButtonComponent cssClass="e-primary" style={{ flex: 1 }} onClick={onFindSlot} disabled={!isOpen}>
          Find Matching Slot
        </ButtonComponent>
        <ButtonComponent cssClass="e-danger e-outline" onClick={onRemove} disabled={removing || !isOpen}>
          {removing ? 'Removing…' : 'Remove'}
        </ButtonComponent>
      </div>
    </div>
  );
};
