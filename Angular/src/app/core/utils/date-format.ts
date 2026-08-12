/**
 * Shared US (en-US) date formatters. All output is forced to the United States
 * numeric locale so dates render consistently regardless of browser locale.
 *
 *   fmtDate     -> "10/14/1976"
 *   fmtDateTime -> "11/26/2026, 8:15 PM"
 *   fmtTime     -> "08:15 PM"
 */

/** Date only, e.g. "10/14/1976". */
export const fmtDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

/** Date + time, e.g. "11/26/2026, 8:15 PM". */
export const fmtDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** Time only, e.g. "08:15 PM". */
export const fmtTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Backward-compatible alias for existing call sites.
 * @deprecated Prefer {@link fmtDateTime}.
 */
export const fmtApptDateTime = fmtDateTime;