import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from '@syncfusion/ej2-angular-layouts';
import type { TimelineItemModel } from '@syncfusion/ej2-angular-layouts';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { fmtDateTime } from '../../core/utils/date-format';
import type { AppointmentSummaryDto, AuditLogEntryDto } from '../../core/models/dtos';

interface TimelineEntry {
  date: number;
  dateLabel: string;
  kind: 'appointment' | 'audit';
  title: string;
  subtitle: string;
  status?: string;
}

const MAX_ITEMS = 10;

const fmt = (iso: string): string =>
  fmtDateTime(iso);

@Component({
  selector: 'app-patient-timeline',
  standalone: true,
  imports: [CommonModule, TimelineModule, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (entries().length === 0) {
      <div class="empty">No recent activity.</div>
    } @else {
      <ejs-timeline [items]="items()" [template]="itemTemplate" cssClass="patient-timeline">
        <ng-template #itemTemplate let-data="">
          @if (entries()[data.itemIndex]; as e) {
            <div class="pt-item">
              <span class="pt-date">{{ e.dateLabel }}</span>
              <div class="pt-rail">
                <span
                  class="pt-dot"
                  [class.timeline-dot-appointment]="e.kind === 'appointment'"
                  [class.timeline-dot-audit]="e.kind !== 'appointment'"></span>
              </div>
              <div class="pt-body">
                <div class="pt-title-row">
                  <span class="pt-title">{{ e.title }}</span>
                  @if (e.status) {
                    <app-status-badge [status]="e.status"></app-status-badge>
                  }
                </div>
                @if (e.subtitle) {
                  <span class="pt-subtitle">{{ e.subtitle }}</span>
                }
              </div>
            </div>
          }
        </ng-template>
      </ejs-timeline>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    .empty {
      font-size: 13px;
      color: var(--color-sf-fg-tertiary);
    }
    ejs-timeline {
      display: block;
      padding: 4px 0;
    }
    .patient-timeline.e-timeline .e-timeline-items,
    .patient-timeline.e-timeline .e-timeline-item,
    .patient-timeline.e-timeline .e-timeline-item.e-item-template {
      display: block;
      width: 100%;
      padding: 0;
      margin: 0;
      min-height: 0;
    }
    .patient-timeline.e-timeline .e-timeline-item::before,
    .patient-timeline.e-timeline .e-timeline-item::after {
      content: none;
    }
    .pt-item {
      display: grid;
      grid-template-columns: 116px 20px 1fr;
      column-gap: 12px;
      align-items: start;
      width: 100%;
    }
    .pt-date {
      font-size: 12px;
      color: var(--color-sf-fg-tertiary);
      white-space: nowrap;
      text-align: right;
      padding-top: 1px;
    }
    .pt-rail {
      position: relative;
      display: flex;
      justify-content: center;
      align-self: stretch;
    }
    .pt-rail::before {
      content: '';
      position: absolute;
      top: 6px;
      bottom: 0;
      width: 2px;
      background: var(--color-sf-border-secondary);
    }
    .patient-timeline.e-timeline .e-timeline-item:last-child .pt-rail::before {
      display: none;
    }
    .pt-dot {
      position: relative;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid transparent;
      margin-top: 3px;
      box-sizing: border-box;
    }
    .pt-dot.timeline-dot-appointment {
      background: var(--color-sf-bg-brand-solid);
      border-color: var(--color-sf-bg-brand-solid);
    }
    .pt-dot.timeline-dot-audit {
      background: var(--color-sf-bg-tertiary);
      border-color: var(--color-sf-border-secondary);
    }
    .pt-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 16px;
    }
    .pt-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pt-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-sf-fg-primary);
    }
    .pt-subtitle {
      font-size: 12px;
      color: var(--color-sf-fg-tertiary);
    }
  `],
})
export class PatientTimelineComponent {
  private _appts = signal<AppointmentSummaryDto[]>([]);
  private _audit = signal<AuditLogEntryDto[]>([]);

  @Input() set appts(value: AppointmentSummaryDto[]) {
    this._appts.set(value ?? []);
  }
  @Input() set auditEntries(value: AuditLogEntryDto[]) {
    this._audit.set(value ?? []);
  }

  readonly entries = computed<TimelineEntry[]>(() => {
    const fromAppts: TimelineEntry[] = this._appts().map((a) => ({
      date: new Date(a.scheduledDateTime).getTime(),
      dateLabel: fmt(a.scheduledDateTime),
      kind: 'appointment',
      title: a.appointmentType,
      subtitle: a.providerName ? `with ${a.providerName}` : '',
      status: a.status,
    }));
    const fromAudit: TimelineEntry[] = this._audit().map((e) => ({
      date: new Date(e.performedAt).getTime(),
      dateLabel: fmt(e.performedAt),
      kind: 'audit',
      title: e.action,
      subtitle: e.performedBy ? `by ${e.performedBy}` : '',
    }));
    return [...fromAppts, ...fromAudit]
      .filter((e) => !Number.isNaN(e.date))
      .sort((x, y) => y.date - x.date)
      .slice(0, MAX_ITEMS);
  });

  readonly items = computed<TimelineItemModel[]>(() =>
    this.entries().map((e) => ({
      dotCss: e.kind === 'appointment' ? 'timeline-dot-appointment' : 'timeline-dot-audit',
    })),
  );
}
