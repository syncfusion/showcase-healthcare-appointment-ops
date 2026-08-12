





export const CHART_FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";




export const SERIES_TEAL = '#0D9488';
export const SERIES_INDIGO = '#6366F1';
export const SERIES_AMBER = '#F59E0B';
export const SERIES_ROSE = '#F43F5E';
export const BAR_RAMP = ['#0D9488', '#6366F1', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F59E0B', '#F43F5E'];
export const CATEGORY_RAMP = ['#0D9488', '#6366F1', '#0EA5E9', '#8B5CF6', '#F59E0B', '#F43F5E', '#14B8A6'];

export const APPOINTMENT_TYPE_SERIES: ReadonlyArray<{ type: string; color: string }> = [
  { type: 'New Patient', color: '#0D9488' },
  { type: 'Follow-Up', color: '#6366F1' },
  { type: 'Annual Physical', color: '#D97706' },
  { type: 'Urgent Care', color: '#F43F5E' },
  { type: 'Consultation', color: '#0284C7' },
  { type: 'Procedure', color: '#8B5CF6' },
  { type: 'Lab Review', color: '#16A34A' },
  { type: 'Telehealth', color: '#EA580C' },
];


export const chartThemeName = (resolved: 'light' | 'dark'): 'Tailwind3' | 'Tailwind3Dark' =>
  resolved === 'dark' ? 'Tailwind3Dark' : 'Tailwind3';


export const chartLegendSettings = {
  visible: true,
  textStyle: { fontFamily: CHART_FONT_FAMILY },
} as const;


export const accumulationLegendSettings = {
  visible: true,
  textStyle: { fontFamily: CHART_FONT_FAMILY },
} as const;


export const COLUMN_STYLE = {
  columnWidth: 0.6,
  cornerRadius: { topLeft: 6, topRight: 6 },
} as const;


export const chartInteraction = {
  selectionMode: 'Point',
  highlightMode: 'Point',
} as const;

export const chartFillHeight = (
  opts: { rows?: number; reserve?: number; floor?: number; cap?: number } = {},
): string => {
  const { rows = 1, reserve = 320, floor = 260, cap = 720 } = opts;
  return `clamp(${floor}px, calc((100vh - ${reserve}px) / ${rows}), ${cap}px)`;
};


const NICE_STEPS = [1, 2, 2.5, 5, 10];


export function niceAxisMax(values: Array<number | null | undefined>): number {
  const max = Math.max(0, ...values.filter((v): v is number => typeof v === 'number' && isFinite(v)));
  if (max <= 0) return 10;
  const padded = max * 1.02;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const norm = padded / magnitude;
  const niceNorm = NICE_STEPS.find((s) => s >= norm) ?? 10;
  return niceNorm * magnitude;
}


export function buildValueAxis<T extends object>(
  values: Array<number | null | undefined>,
  base?: T,
): T & { maximum: number; interval: number } {
  const maximum = niceAxisMax(values);
  return { ...(base as T), maximum, interval: maximum / 5 };
}


export { Highlight, Selection } from '@syncfusion/ej2-react-charts';
