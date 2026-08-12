import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { fmtDate } from '../../core/utils/date-format';
import type { WaitlistEntryDto } from '../../core/models/dtos';

const urgencyWeight: Record<WaitlistEntryDto['urgencyLevel'], number> = {
  Routine: 33,
  Urgent: 66,
  Emergency: 100,
};

function formatDate(value: string): string {
  return fmtDate(value);
}

function daysSince(value: string): number {
  const d = new Date(value);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

@Component({
  selector: 'app-waitlist-entry-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './waitlist-entry-detail.component.html',
  styleUrl: './waitlist-entry-detail.component.scss',
})
export class WaitlistEntryDetailComponent {
  @Input({ required: true }) entry!: WaitlistEntryDto;
  @Input() removing = false;
  @Output() close = new EventEmitter<void>();
  @Output() findSlot = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  get isOpen(): boolean {
    return this.entry.status === 'Open';
  }

  get waitDays(): number {
    return daysSince(this.entry.requestDateTime);
  }

  get urgencyPct(): number {
    return urgencyWeight[this.entry.urgencyLevel] ?? 33;
  }

  get waitPct(): number {
    return Math.min(100, (this.waitDays / 30) * 100);
  }

  formatDate = formatDate;
}
