import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, type ThemeMode } from '../../theme/ThemeProvider';

const OPTIONS: { mode: ThemeMode; label: string; icon: React.ElementType }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];


export const ThemeSwitcher: React.FC = () => {
  const { mode, resolved, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const TriggerIcon = resolved === 'dark' ? Moon : Sun;

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change theme"
        title="Change theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          borderRadius: 'var(--radius-8)',
          border: '1px solid var(--color-sf-border-secondary)',
          background: 'var(--color-sf-bg-primary)',
          color: 'var(--color-sf-fg-tertiary)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <TriggerIcon size={18} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 160,
            background: 'var(--color-sf-bg-primary)',
            border: '1px solid var(--color-sf-border-secondary)',
            borderRadius: 'var(--radius-8)',
            boxShadow: 'var(--shadow-lg)',
            padding: 4,
            zIndex: 1000,
          }}
        >
          {OPTIONS.map(({ mode: optMode, label, icon: Icon }) => {
            const active = mode === optMode;
            return (
              <button
                key={optMode}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setMode(optMode);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: 'var(--radius-6)',
                  background: active ? 'var(--color-sf-bg-brand-primary)' : 'transparent',
                  color: active ? 'var(--color-sf-fg-brand-primary)' : 'var(--color-sf-fg-secondary)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span style={{ flex: 1 }}>{label}</span>
                {active && <Check size={15} strokeWidth={2.25} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
