import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">{{ title }}</div>
      @if (description) {
        <div class="empty-description">{{ description }}</div>
      }
      @if (actionLabel && action.observed) {
        <div class="empty-actions">
          <button ejs-button cssClass="e-primary" (click)="action.emit()">{{ actionLabel }}</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 48px 16px;
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .empty-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-sf-fg-secondary);
    }
    .empty-description {
      font-size: 14px;
      color: var(--color-sf-fg-tertiary);
      margin-top: 8px;
    }
    .empty-actions {
      margin-top: 16px;
    }
  `],
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
