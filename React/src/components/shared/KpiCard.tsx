import React from 'react';
import { SkeletonComponent } from '@syncfusion/ej2-react-notifications';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, trend, trendValue, loading, icon }) => {
  const trendColor =
    trend === 'up'
      ? 'var(--color-sf-fg-success-primary)'
      : trend === 'down'
        ? 'var(--color-sf-fg-error-primary)'
        : 'var(--color-sf-fg-tertiary)';

  if (loading) {
    return (
      <div className="e-card kpi-card" style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonComponent shape="Text" width="60%" height="16px" />
          <SkeletonComponent shape="Text" width="40%" height="32px" />
        </div>
      </div>
    );
  }

  return (
    <div className="e-card kpi-card" style={{ ...cardStyle, position: 'relative' }}>
      {icon && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--color-sf-bg-tertiary)',
            border: '1px solid var(--color-sf-border-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-sf-fg-tertiary)',
            zIndex: 1,
          }}
        >
          {icon}
        </div>
      )}
      <div className="e-card-header" style={{ padding: 0, border: 'none', borderTop: 'none' }}>
        <div className="e-card-header-caption" style={{ padding: 0 }}>
          <div
            className="e-card-sub-title"
            style={{ margin: 0, fontSize: 12, color: 'var(--color-sf-fg-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: icon ? 40 : 0 }}
          >
            {title}
          </div>
        </div>
      </div>
      <div className="e-card-content" style={{ padding: 0, border: 'none', borderTop: 'none', fontSize: 28, fontWeight: 700, color: 'var(--color-sf-fg-primary)', margin: '8px 0' }}>
        {value}
      </div>
      <div className="e-card-actions" style={{ padding: 0, margin: 0, border: 'none', borderTop: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend && trendValue && (
          <span style={{ color: trendColor, fontWeight: 600, fontSize: 12 }}>{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} {trendValue}</span>
        )}
        {subtitle && <span style={{ color: 'var(--color-sf-fg-quinary)', fontSize: 12 }}>{subtitle}</span>}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: 'var(--color-sf-bg-primary)',
  borderRadius: 'var(--radius-12)',
  padding: 20,
  border: '1px solid var(--color-sf-border-secondary)',
  boxShadow: 'var(--shadow-sm)',
  minWidth: 180,
  flex: '1 1 180px',
};
