import React from 'react';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';

export interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div
      style={{
        background: 'var(--color-sf-bg-error-primary)',
        border: '1px solid var(--color-sf-border-error)',
        borderRadius: 8,
        padding: 16,
        color: 'var(--color-sf-fg-error-primary)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
      {onRetry && (
        <div style={{ marginTop: 12 }}>
          <ButtonComponent cssClass="e-danger e-outline" onClick={onRetry}>
            Retry
          </ButtonComponent>
        </div>
      )}
    </div>
  );
};
