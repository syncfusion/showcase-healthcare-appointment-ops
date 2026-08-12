import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import {
  GridModule,
  PageService,
  SortService,
  FilterService,
  ToolbarService,
  DetailRowService,
  GridComponent,
} from '@syncfusion/ej2-angular-grids';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ProviderScheduleDetailComponent } from './provider-schedule-detail.component';
import type { ProviderSummaryDto } from '../../core/models/dtos';

const CHIP_COLORS: Record<string, { bg: string; fg: string }> = {
  cardiology: { bg: 'var(--color-sf-chip-cardiology-bg)', fg: 'var(--color-sf-chip-cardiology-fg)' },
  neurology: { bg: 'var(--color-sf-chip-neurology-bg)', fg: 'var(--color-sf-chip-neurology-fg)' },
  orthopedics: { bg: 'var(--color-sf-chip-orthopedics-bg)', fg: 'var(--color-sf-chip-orthopedics-fg)' },
  pediatrics: { bg: 'var(--color-sf-chip-pediatrics-bg)', fg: 'var(--color-sf-chip-pediatrics-fg)' },
  dermatology: { bg: 'var(--color-sf-chip-dermatology-bg)', fg: 'var(--color-sf-chip-dermatology-fg)' },
  ophthalmology: { bg: 'var(--color-sf-chip-ophthalmology-bg)', fg: 'var(--color-sf-chip-ophthalmology-fg)' },
  'internal medicine': { bg: 'var(--color-sf-chip-internal-medicine-bg)', fg: 'var(--color-sf-chip-internal-medicine-fg)' },
  'family medicine': { bg: 'var(--color-sf-chip-family-medicine-bg)', fg: 'var(--color-sf-chip-family-medicine-fg)' },
  'obstetrics & gynecology': { bg: 'var(--color-sf-chip-obstetrics-gynecology-bg)', fg: 'var(--color-sf-chip-obstetrics-gynecology-fg)' },
  obstetrics: { bg: 'var(--color-sf-chip-obstetrics-bg)', fg: 'var(--color-sf-chip-obstetrics-fg)' },
  gynecology: { bg: 'var(--color-sf-chip-gynecology-bg)', fg: 'var(--color-sf-chip-gynecology-fg)' },
  endocrinology: { bg: 'var(--color-sf-chip-endocrinology-bg)', fg: 'var(--color-sf-chip-endocrinology-fg)' },
  oncology: { bg: 'var(--color-sf-chip-oncology-bg)', fg: 'var(--color-sf-chip-oncology-fg)' },
  psychiatry: { bg: 'var(--color-sf-chip-psychiatry-bg)', fg: 'var(--color-sf-chip-psychiatry-fg)' },
  gastroenterology: { bg: 'var(--color-sf-chip-gastroenterology-bg)', fg: 'var(--color-sf-chip-gastroenterology-fg)' },
  urology: { bg: 'var(--color-sf-chip-urology-bg)', fg: 'var(--color-sf-chip-urology-fg)' },
  radiology: { bg: 'var(--color-sf-chip-radiology-bg)', fg: 'var(--color-sf-chip-radiology-fg)' },
  pulmonology: { bg: 'var(--color-sf-chip-pulmonology-bg)', fg: 'var(--color-sf-chip-pulmonology-fg)' },
  nephrology: { bg: 'var(--color-sf-chip-nephrology-bg)', fg: 'var(--color-sf-chip-nephrology-fg)' },
  rheumatology: { bg: 'var(--color-sf-chip-rheumatology-bg)', fg: 'var(--color-sf-chip-rheumatology-fg)' },
};

const NEUTRAL_CHIP = { bg: 'var(--color-sf-chip-neutral-bg)', fg: 'var(--color-sf-chip-neutral-fg)' };

function chipColor(value: string): { bg: string; fg: string } {
  const key = value.trim().toLowerCase();
  const match = Object.keys(CHIP_COLORS).find((k) => key.includes(k));
  return match ? CHIP_COLORS[match] : NEUTRAL_CHIP;
}

function initialsOf(first: string, last: string): string {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase();
}

@Component({
  selector: 'app-provider-list-page',
  standalone: true,
  imports: [
    CommonModule,
    GridModule,
    ButtonModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
    ProviderScheduleDetailComponent,
  ],
  providers: [PageService, SortService, FilterService, ToolbarService, DetailRowService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './provider-list-page.component.html',
  styleUrl: './provider-list-page.component.scss',
})
export class ProviderListPageComponent {
  private healthcare = inject(HealthcareService);
  private router = inject(Router);

  @ViewChild('grid') grid?: GridComponent;

  private readonly providersState = createAsyncResult<{ items: ProviderSummaryDto[] }>(() =>
    this.healthcare.listProviders().pipe(map((res) => okOrThrow(res)))
  );

  readonly items = computed(() => this.providersState.data?.items ?? []);
  readonly loading = computed(() => this.providersState.loading);
  readonly error = computed(() => this.providersState.error);

  readonly pageSettings = { pageSize: 50 };
  readonly toolbar = ['Search'];
  readonly filterSettings = { type: 'Excel' as const };

  retry(): void {
    this.providersState.refresh();
  }

  viewProvider(providerId: string): void {
    this.router.navigate(['/providers', providerId]);
  }

  chipStyle(value: string): { background: string; color: string } {
    const { bg, fg } = chipColor(value);
    return { background: bg, color: fg };
  }

  providerName(props: ProviderSummaryDto): string {
    return `Dr. ${props.firstName} ${props.lastName}${props.title ? `, ${props.title}` : ''}`;
  }

  initials(props: ProviderSummaryDto): string {
    return initialsOf(props.firstName, props.lastName);
  }

  avgDuration(props: ProviderSummaryDto): number {
    return Number(props?.averageAppointmentDuration ?? 0);
  }
}
