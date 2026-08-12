import type { ScheduleTemplateDto } from '@models/dtos';


export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


export function formatTime12h(time: string): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}


export function sortTemplates(templates: ScheduleTemplateDto[]): ScheduleTemplateDto[] {
  return [...templates].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
  );
}
