import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-banner">
      <div class="error-title">{{ title }}</div>
      <div class="error-message">{{ message }}</div>
      @if (retry.observed) {
        <div class="error-actions">
          <button ejs-button cssClass="e-danger e-outline" (click)="retry.emit()">Retry</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .error-banner {
      background: var(--color-sf-bg-error-primary);
      border: 1px solid var(--color-sf-border-error);
      border-radius: var(--radius-8);
      padding: 16px;
      color: var(--color-sf-fg-error-primary);
    }
    .error-title {
      font-weight: 700;
      margin-bottom: 4px;
    }
    .error-message {
      font-size: 14px;
    }
    .error-actions {
      margin-top: 12px;
    }
  `],
})
export class ErrorBannerComponent {
  @Input() title = 'Something went wrong';
  @Input({ required: true }) message!: string;
  @Output() retry = new EventEmitter<void>();
}
