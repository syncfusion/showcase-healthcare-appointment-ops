import React from 'react';
import { TimelineComponent, ItemsDirective, ItemDirective } from '@syncfusion/ej2-react-layouts';
import type { AppointmentSummaryDto, AuditLogEntryDto } from '@models/dtos';
import { fmtDateTime } from '../../utils/dateFormat';

interface TimelineEntry {
  date: number;
  dateLabel: string;
  kind: 'appointment' | 'audit';
  title: string;
  subtitle: string;
  status?: string;
}

const MAX_ITEMS = 10;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const statusPalette: Record<string, { bg: string; color: string }> = {
  Scheduled: { bg: 'var(--color-sf-bg-brand-primary)', color: 'var(--color-sf-fg-brand-primary)' },
  Confirmed: { bg: 'var(--color-sf-bg-success-primary)', color: 'var(--color-sf-fg-success-primary)' },
  CheckedIn: { bg: 'var(--color-sf-bg-warning-primary)', color: 'var(--color-sf-fg-warning-primary)' },
  InProgress: { bg: 'var(--color-sf-bg-info-primary)', color: 'var(--color-sf-fg-info-primary)' },
  Completed: { bg: 'var(--color-sf-bg-success-primary)', color: 'var(--color-sf-fg-success-primary)' },
  Cancelled: { bg: 'var(--color-sf-bg-error-primary)', color: 'var(--color-sf-fg-error-primary)' },
  NoShow: { bg: 'var(--color-sf-bg-tertiary)', color: 'var(--color-sf-fg-secondary)' },
};

const neutralTone = { bg: 'var(--color-sf-bg-tertiary)', color: 'var(--color-sf-fg-secondary)' };

const badgeHtml = (status: string) => {
  const t = statusPalette[status] ?? neutralTone;
  return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${t.bg};color:${t.color};">${esc(status)}</span>`;
};

const contentHtml = (e: TimelineEntry) =>
  `<div style="display:flex;flex-direction:column;gap:4px;padding-bottom:16px;">` +
  `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">` +
  `<span style="font-size:14px;font-weight:600;color:var(--color-sf-fg-primary);">${esc(e.title)}</span>` +
  (e.status ? badgeHtml(e.status) : '') +
  `</div>` +
  (e.subtitle ? `<span style="font-size:12px;color:var(--color-sf-fg-tertiary);">${esc(e.subtitle)}</span>` : '') +
  `</div>`;

const oppositeHtml = (e: TimelineEntry) =>
  `<span style="font-size:12px;color:var(--color-sf-fg-tertiary);white-space:nowrap;">${esc(e.dateLabel)}</span>`;

export const PatientTimeline: React.FC<{
  appts: AppointmentSummaryDto[];
  auditEntries: AuditLogEntryDto[];
  onViewAudit?: () => void;
}> = ({ appts, auditEntries, onViewAudit }) => {
  const entries = React.useMemo<TimelineEntry[]>(() => {
    const now = Date.now();
    const fromAppts: TimelineEntry[] = appts.map((a) => ({
      date: new Date(a.scheduledDateTime).getTime(),
      dateLabel: fmtDateTime(a.scheduledDateTime),
      kind: 'appointment',
      title: a.appointmentType,
      subtitle: a.providerName ? `with ${a.providerName}` : '',
      status: a.status,
    }));
    const fromAudit: TimelineEntry[] = auditEntries.map((e) => ({
      date: new Date(e.performedAt).getTime(),
      dateLabel: fmtDateTime(e.performedAt),
      kind: 'audit',
      title: e.action,
      subtitle: e.performedBy ? `by ${e.performedBy}` : '',
    }));
    return [...fromAppts, ...fromAudit]
      .filter((e) => !Number.isNaN(e.date) && e.date <= now)
      .sort((x, y) => y.date - x.date)
      .slice(0, MAX_ITEMS);
  }, [appts, auditEntries]);

  if (entries.length === 0) {
    return <div style={{ fontSize: 13, color: 'var(--color-sf-fg-tertiary)' }}>No recent activity.</div>;
  }

  return (
    <div>
      <TimelineComponent align="After">
        <ItemsDirective>
          {entries.map((e, i) => (
            <ItemDirective
              key={i}
              dotCss={e.kind === 'appointment' ? 'timeline-dot-appointment' : 'timeline-dot-audit'}
              content={contentHtml(e)}
              oppositeContent={oppositeHtml(e)}
            />
          ))}
        </ItemsDirective>
      </TimelineComponent>
      {onViewAudit && (
        <button
          onClick={onViewAudit}
          style={{
            marginTop: 4,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-sf-fg-brand-primary)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
          }}
        >
          View Audit Log →
        </button>
      )}
    </div>
  );
};
