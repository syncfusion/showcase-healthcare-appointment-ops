import React, { useEffect, useRef } from 'react';
import { createSpinner, showSpinner, hideSpinner } from '@syncfusion/ej2-popups';

export interface LoadingStateProps {
  
  label?: string;
  
  inline?: boolean;
}


export const LoadingState: React.FC<LoadingStateProps> = ({ label, inline = false }) => {
  const spinnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = spinnerRef.current;
    if (!target) return;
    createSpinner({ target, width: inline ? 18 : 28 });
    showSpinner(target);
    return () => {
      hideSpinner(target);
    };
  }, [inline]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={
        inline
          ? { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px' }
          : {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '40px 16px',
              minHeight: 120,
            }
      }
    >
      <div ref={spinnerRef} style={{ position: 'relative', width: inline ? 18 : 28, height: inline ? 18 : 28 }} />
      {label && (
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-sf-fg-tertiary)' }}>{label}</span>
      )}
    </div>
  );
};
