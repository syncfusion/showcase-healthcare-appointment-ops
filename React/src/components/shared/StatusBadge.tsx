import React from 'react';



const tone = {
  brand: { bg: 'var(--color-sf-bg-brand-primary)', color: 'var(--color-sf-fg-brand-primary)' },
  success: { bg: 'var(--color-sf-bg-success-primary)', color: 'var(--color-sf-fg-success-primary)' },
  warning: { bg: 'var(--color-sf-bg-warning-primary)', color: 'var(--color-sf-fg-warning-primary)' },
  info: { bg: 'var(--color-sf-bg-info-primary)', color: 'var(--color-sf-fg-info-primary)' },
  error: { bg: 'var(--color-sf-bg-error-primary)', color: 'var(--color-sf-fg-error-primary)' },
  neutral: { bg: 'var(--color-sf-bg-tertiary)', color: 'var(--color-sf-fg-secondary)' },
} as const;

const statusPalette: Record<string, { bg: string; color: string }> = {
  Scheduled: tone.brand,
  Confirmed: tone.success,
  CheckedIn: tone.warning,
  InProgress: tone.info,
  Completed: tone.success,
  Cancelled: tone.error,
  NoShow: tone.neutral,
  Open: tone.brand,
  Matched: tone.success,
  ClosedExpired: tone.neutral,
  ClosedCancelled: tone.error,
  Routine: tone.brand,
  Urgent: tone.warning,
  Emergency: tone.error,
  Active: tone.success,
  Inactive: tone.neutral,
};

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = statusPalette[status] ?? tone.neutral;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
};
