import React from 'react';

export interface InitialsAvatarProps {
  first: string;
  last: string;
  size?: number;
  color?: string;
}

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ first, last, size = 40, color = 'var(--color-sf-bg-brand-solid)' }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      color: 'var(--color-sf-fg-on-brand-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.375),
      fontWeight: 700,
      flexShrink: 0,
    }}
  >
    {(first?.[0] ?? '')}{(last?.[0] ?? '')}
  </div>
);
