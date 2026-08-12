import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

const tone = {
  brand: { bg: 'var(--color-sf-bg-brand-primary)', color: 'var(--color-sf-fg-brand-primary)' },
  success: { bg: 'var(--color-sf-bg-success-primary)', color: 'var(--color-sf-fg-success-primary)' },
  warning: { bg: 'var(--color-sf-bg-warning-primary)', color: 'var(--color-sf-fg-warning-primary)' },
  info: { bg: 'var(--color-sf-bg-info-primary)', color: 'var(--color-sf-fg-info-primary)' },
  error: { bg: 'var(--color-sf-bg-error-primary)', color: 'var(--color-sf-fg-error-primary)' },
  neutral: { bg: 'var(--color-sf-bg-tertiary)', color: 'var(--color-sf-fg-secondary)' },
} as const;

const statusPalette: Record<string, { bg: string; color: string }> = {
  Scheduled: tone.brand,
  Confirmed: tone.success,
  CheckedIn: tone.warning,
  InProgress: tone.info,
  Completed: tone.success,
  Cancelled: tone.error,
  NoShow: tone.neutral,
  Open: tone.brand,
  Matched: tone.success,
  ClosedExpired: tone.neutral,
  ClosedCancelled: tone.error,
  Routine: tone.brand,
  Urgent: tone.warning,
  Emergency: tone.error,
  Active: tone.success,
  Inactive: tone.neutral,
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [style.background]="style.bg" [style.color]="style.color">{{ status }}</span>`,
  styles: [`
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
  `],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: string;

  get style(): { bg: string; color: string } {
    return statusPalette[this.status] ?? tone.neutral;
  }
}
