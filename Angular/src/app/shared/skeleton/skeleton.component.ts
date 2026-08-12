import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="skeleton-shimmer" [style.width]="width" [style.height]="height" [style.border-radius]="radius" aria-hidden="true"></div>`,
})
export class SkeletonComponent {
  @Input() width: string | number = '100%';
  @Input() height: string | number = '16px';
  @Input() radius: string | number = '4px';
}
