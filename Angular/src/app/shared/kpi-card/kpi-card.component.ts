import { Component, Input, ChangeDetectionStrategy, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from '@syncfusion/ej2-angular-notifications';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="e-card kpi-card">
      @if (loading) {
        <ejs-skeleton shape="Text" width="60%" height="16px" [style.margin-bottom]="'8px'"></ejs-skeleton>
        <ejs-skeleton shape="Text" width="40%" height="32px"></ejs-skeleton>
      } @else {
        @if (icon) {
          <div class="kpi-icon">
            <ng-container *ngTemplateOutlet="icon"></ng-container>
          </div>
        }
        <div class="e-card-header">
          <div class="e-card-header-caption">
            <div class="e-card-sub-title kpi-title" [style.padding-right]="icon ? '40px' : '0'">{{ title }}</div>
          </div>
        </div>
        <div class="e-card-content kpi-value">{{ value }}</div>
        <div class="e-card-actions kpi-footer">
          @if (trend && trendValue) {
            <span class="kpi-trend" [style.color]="trendColor">{{ trendArrow }} {{ trendValue }}</span>
          }
          @if (subtitle) {
            <span class="kpi-subtitle">{{ subtitle }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      flex: 1 1 180px;
      min-width: 180px;
    }

    .kpi-card.e-card {
      background: var(--color-sf-bg-primary);
      border-radius: var(--radius-12);
      padding: 20px;
      border: 1px solid var(--color-sf-border-secondary);
      box-shadow: var(--shadow-sm);
      box-sizing: border-box;
      width: 100%;
      position: relative;
    }

    .kpi-card .e-card-header,
    .kpi-card .e-card-header-caption,
    .kpi-card .e-card-content,
    .kpi-card .e-card-actions {
      padding: 0;
      margin: 0;
      border: 0;
    }
    .kpi-card .e-card-content {
      flex: 0 0 auto;
    }
    .kpi-icon {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-sf-bg-tertiary);
      border: 1px solid var(--color-sf-border-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-sf-fg-tertiary);
    }

    .kpi-card .e-card-sub-title.kpi-title {
      font-size: 12px;
      color: var(--color-sf-fg-tertiary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-card .e-card-content.kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-sf-fg-primary);
      margin: 8px 0;
    }
    .kpi-card .e-card-actions.kpi-footer {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
    }
    .kpi-trend {
      font-weight: 600;
      font-size: 12px;
    }
    .kpi-subtitle {
      color: var(--color-sf-fg-quinary);
      font-size: 12px;
    }
  `],
})
export class KpiCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input() subtitle?: string;
  @Input() trend?: 'up' | 'down' | 'neutral';
  @Input() trendValue?: string;
  @Input() loading = false;
  @ContentChild('icon', { static: false }) icon?: TemplateRef<unknown>;

  get trendColor(): string {
    return this.trend === 'up'
      ? 'var(--color-sf-fg-success-primary)'
      : this.trend === 'down'
      ? 'var(--color-sf-fg-error-primary)'
      : 'var(--color-sf-fg-tertiary)';
  }

  get trendArrow(): string {
    return this.trend === 'up' ? '▲' : this.trend === 'down' ? '▼' : '—';
  }
}
