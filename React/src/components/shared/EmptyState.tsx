import React from 'react';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-sf-fg-secondary)' }}>{title}</div>
      {description && <div style={{ fontSize: 14, color: 'var(--color-sf-fg-tertiary)', marginTop: 8 }}>{description}</div>}
      {actionLabel && onAction && (
        <div style={{ marginTop: 16 }}>
          <ButtonComponent cssClass="e-primary" onClick={onAction}>
            {actionLabel}
          </ButtonComponent>
        </div>
      )}
    </div>
  );
};
