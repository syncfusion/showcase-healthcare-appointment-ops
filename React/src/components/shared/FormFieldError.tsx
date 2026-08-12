import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldErrorProps {
  message?: string;
}


export const FormFieldError: React.FC<FormFieldErrorProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-sf-fg-error-primary)',
      }}
    >
      <AlertCircle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
};
