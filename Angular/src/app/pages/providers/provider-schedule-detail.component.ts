import { Component, inject, computed, signal, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, of } from 'rxjs';
import { GridModule, SortService } from '@syncfusion/ej2-angular-grids';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import type { ScheduleTemplateDto } from '../../core/models/dtos';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime12h(time: string): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function sortTemplates(templates: ScheduleTemplateDto[]): ScheduleTemplateDto[] {
  return [...templates].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
  );
}

@Component({
  selector: 'app-provider-schedule-detail',
  standalone: true,
  imports: [CommonModule, GridModule, EmptyStateComponent, LoadingStateComponent],
  providers: [SortService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail-wrap">
      <div class="detail-title">Weekly Availability</div>
      <div class="detail-subtitle">Recurring schedule templates for this provider.</div>
      @if (loading() && templates().length === 0) {
        <app-loading-state inline label="Loading templates…"></app-loading-state>
      } @else if (templates().length === 0) {
        <app-empty-state
          title="No templates"
          description="This provider has no schedule templates yet.">
        </app-empty-state>
      } @else {
        <ejs-grid [dataSource]="templates()" [allowSorting]="true">
          <e-columns>
            <e-column field="dayOfWeek" headerText="Day" width="90">
              <ng-template #template let-data>{{ dayLabel(data.dayOfWeek) }}</ng-template>
            </e-column>
            <e-column field="startTime" headerText="Start" width="100">
              <ng-template #template let-data>{{ formatTime(data.startTime) }}</ng-template>
            </e-column>
            <e-column field="endTime" headerText="End" width="100">
              <ng-template #template let-data>{{ formatTime(data.endTime) }}</ng-template>
            </e-column>
            <e-column field="slotDuration" headerText="Slot (min)" width="100"></e-column>
            <e-column field="effectiveFrom" headerText="From" width="120">
              <ng-template #template let-data>{{ data.effectiveFrom | date:'MM/dd/yyyy' }}</ng-template>
            </e-column>
            <e-column field="effectiveTo" headerText="To" width="120">
              <ng-template #template let-data>{{ data.effectiveTo ? (data.effectiveTo | date:'MM/dd/yyyy') : 'Ongoing' }}</ng-template>
            </e-column>
            <e-column field="isActive" headerText="Active" width="90" displayAsCheckBox="true"></e-column>
          </e-columns>
        </ejs-grid>
      }
    </div>
  `,
  styles: [`
    .detail-wrap {
      padding: 16px;
    }
    .detail-title {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 4px;
      color: var(--color-sf-fg-secondary);
    }
    .detail-subtitle {
      font-size: 12px;
      color: var(--color-sf-fg-tertiary);
      margin-bottom: 12px;
    }
  `],
})
export class ProviderScheduleDetailComponent {
  private healthcare = inject(HealthcareService);

  private readonly providerId = signal<string | undefined>(undefined);

  @Input() set data(value: { providerId: string } | undefined) {
    this.providerId.set(value?.providerId);
    if (value?.providerId) this.templatesState.refresh();
  }

  private readonly templatesState = createAsyncResult<ScheduleTemplateDto[]>(
    () =>
      this.providerId()
        ? this.healthcare.getProviderTemplates(this.providerId()!).pipe(map((res) => okOrThrow(res)))
        : of([]),
    { immediate: false }
  );

  readonly templates = computed(() => sortTemplates(this.templatesState.data ?? []));
  readonly loading = computed(() => this.templatesState.loading);

  dayLabel(dayOfWeek: number): string {
    return DAY_LABELS[dayOfWeek] ?? String(dayOfWeek);
  }

  formatTime(time: string): string {
    return formatTime12h(time);
  }
}
