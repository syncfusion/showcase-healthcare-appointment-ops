export const APPOINTMENT_TYPE_COLORS: Record<string, string> = {
  Consultation: 'var(--color-sf-appt-consultation)',
  'Annual Physical': 'var(--color-sf-appt-annual-physical)',
  'Lab Review': 'var(--color-sf-appt-lab-review)',
  Telehealth: 'var(--color-sf-appt-telehealth)',
  Procedure: 'var(--color-sf-appt-procedure)',
  'Follow-Up': 'var(--color-sf-appt-follow-up)',
  'Urgent Care': 'var(--color-sf-appt-urgent-care)',
  Vaccination: 'var(--color-sf-appt-vaccination)',
  Imaging: 'var(--color-sf-appt-imaging)',
  Administrative: 'var(--color-sf-appt-administrative)',
  'New Patient': 'var(--color-sf-appt-new-patient)',
  'Follow-Up Visit': 'var(--color-sf-appt-follow-up-visit)',
  'Urgent Visit': 'var(--color-sf-appt-urgent-visit)',
  'Annual Exam': 'var(--color-sf-appt-annual-exam)',
};

export const FALLBACK_APPOINTMENT_COLOR = 'var(--color-sf-appt-fallback)';

export function getAppointmentColor(type: string): string {
  return APPOINTMENT_TYPE_COLORS[type] ?? FALLBACK_APPOINTMENT_COLOR;
}

export function chooseTextColor(backgroundColor: string): 'white' | 'black' {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const linearize = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  return luminance > 0.179 ? 'black' : 'white';
}
