import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label) {
      <div class="loading-label" [class.loading-label--inline]="inline">
        <span class="spinner" aria-hidden="true"></span>
        <span>{{ label }}</span>
      </div>
    } @else {
      <div class="loading-state">
        @for (row of rows; track row) {
          <div class="loading-row" [style.gap]="gap + 'px'">
            @for (cell of cells; track cell) {
              <app-skeleton [width]="cell.width" [height]="cell.height" [radius]="cell.radius ?? '4px'"></app-skeleton>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .loading-row {
      display: flex;
      align-items: center;
    }
    .loading-label {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 24px;
      color: var(--color-sf-fg-tertiary);
      font-size: 13px;
    }
    .loading-label--inline {
      padding: 8px 0;
    }
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid var(--color-sf-border-secondary);
      border-top-color: var(--color-sf-bg-brand-solid);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class LoadingStateComponent {
  @Input({ transform: (v: unknown) => v === '' || v === true }) inline = false;
  @Input() rowCount = 4;
  @Input() gap = 12;
  @Input() label?: string;
  @Input() cells: Array<{ width: string | number; height: string | number; radius?: string | number }> = [
    { width: '40px', height: '40px', radius: '50%' },
    { width: '50%', height: '16px' },
    { width: '30%', height: '16px' },
  ];

  get rows(): number[] {
    return Array.from({ length: this.rowCount }, (_, i) => i);
  }
}
