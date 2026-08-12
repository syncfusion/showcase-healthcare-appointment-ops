import { Component, inject, computed, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import {
  KanbanModule,
  CardSettingsModel,
  DragEventArgs,
  CardClickEventArgs,
} from '@syncfusion/ej2-angular-kanban';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { DateTimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { AIAssistViewModule } from '@syncfusion/ej2-angular-interactive-chat';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { fmtDate, fmtTime } from '../../core/utils/date-format';
import { WaitlistEntryDetailComponent } from './waitlist-entry-detail.component';
import { SlotMatchDialogComponent } from './slot-match-dialog.component';
import type {
  WaitlistEntryDto,
  DepartmentDto,
  ScheduleOptimizationDto,
  ScheduleOptimizationSuggestionDto,
} from '../../core/models/dtos';

type Suggestion = ScheduleOptimizationSuggestionDto;

const urgencyOptions = [
  { text: 'All urgencies', value: '' },
  { text: 'Emergency', value: 'Emergency' },
  { text: 'Urgent', value: 'Urgent' },
  { text: 'Routine', value: 'Routine' },
];

const sortOptions = [
  { text: 'Priority: High → Low', value: 'desc' },
  { text: 'Priority: Low → High', value: 'asc' },
];

const suggestionTypeLabel: Record<Suggestion['type'], string> = {
  fill: 'Fill Gap',
  shift: 'Reschedule',
  extend: 'Extend Hours',
};

function confidenceBadge(c: number): { label: string; bg: string; color: string } {
  if (c >= 0.8) return { label: 'High confidence', bg: 'var(--color-sf-bg-success-primary)', color: 'var(--color-sf-fg-success-primary)' };
  if (c >= 0.5) return { label: 'Medium confidence', bg: 'var(--color-sf-bg-warning-primary)', color: 'var(--color-sf-fg-warning-primary)' };
  return { label: 'Low confidence', bg: 'var(--color-sf-bg-error-primary)', color: 'var(--color-sf-fg-error-primary)' };
}

function fmtTimeLocal(value: string): string {
  return fmtTime(value);
}

function daysWaiting(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

@Component({
  selector: 'app-waitlist-page',
  standalone: true,
  imports: [
    CommonModule,
    KanbanModule,
    DropDownListModule,
    ButtonModule,
    DialogModule,
    DateTimePickerModule,
    AIAssistViewModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
    WaitlistEntryDetailComponent,
    SlotMatchDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './waitlist-page.component.html',
  styleUrl: './waitlist-page.component.scss',
})
export class WaitlistPageComponent {
  private healthcare = inject(HealthcareService);
  private destroyRef = inject(DestroyRef);
  private readonly mobileBreakpoint = 768;

  readonly urgencyOptions = urgencyOptions;
  readonly sortOptions = sortOptions;
  readonly suggestionTypeLabel = suggestionTypeLabel;
  readonly isMobile = signal(
    typeof window !== 'undefined' && window.innerWidth <= this.mobileBreakpoint
  );

  constructor() {
    if (typeof window === 'undefined') return;
    const onResize = () => this.isMobile.set(window.innerWidth <= this.mobileBreakpoint);
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
  }

  readonly departmentFilter = signal<string>('');
  readonly urgencyFilter = signal<string>('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly selectedEntry = signal<WaitlistEntryDto | null>(null);
  readonly removing = signal(false);
  readonly slotEntry = signal<WaitlistEntryDto | null>(null);
  readonly aiOpen = signal(false);
  readonly aiLoading = signal(false);
  readonly aiResult = signal<ScheduleOptimizationDto | null>(null);
  readonly editing = signal<{ suggestion: Suggestion; start: Date; end: Date } | null>(null);

  private readonly departmentsState = createAsyncResult<DepartmentDto[]>(() =>
    this.healthcare.listDepartments().pipe(map((res) => okOrThrow(res)))
  );

  readonly departmentOptions = computed(() => {
    const data = this.departmentsState.data ?? [];
    return [...data]
      .map((d) => ({
        ...d,
        displayLabel: `${d.departmentName} — ${d.locationName}`,
      }))
      .sort((a, b) => {
        const loc = (a.locationName ?? '').localeCompare(b.locationName ?? '');
        return loc !== 0 ? loc : (a.departmentName ?? '').localeCompare(b.departmentName ?? '');
      });
  });
  readonly departmentFields = { text: 'displayLabel', value: 'departmentId', groupBy: 'locationName' };
  readonly urgencyFields = { text: 'text', value: 'value' };
  readonly sortFields = { text: 'text', value: 'value' };

  private readonly waitlistState = createAsyncResult<{ items: WaitlistEntryDto[] }>(() =>
    this.healthcare
      .listWaitlist(undefined, this.departmentFilter() || undefined)
      .pipe(map((res) => okOrThrow(res)))
  );

  readonly items = computed<WaitlistEntryDto[]>(() => {
    const raw = this.waitlistState.data?.items ?? [];
    const filtered = this.urgencyFilter() ? raw.filter((i) => i.urgencyLevel === this.urgencyFilter()) : raw.slice();
    const dir = this.sortDir() === 'desc' ? -1 : 1;
    const sorted = filtered.sort((a, b) => dir * (a.priorityScore - b.priorityScore));
    return sorted.map((i) => {
      const location = i.preferredLocationName ?? '';
      const text = location ? `${i.preferredDepartmentName} — ${location}` : i.preferredDepartmentName;
      return { ...i, swimlaneKey: i.preferredDepartmentId, swimlaneText: text };
    });
  });

  readonly loading = computed(() => this.waitlistState.loading);
  readonly error = computed(() => this.waitlistState.error);

  readonly cardSettings: CardSettingsModel = {
    headerField: 'waitlistId',
    contentField: 'patientName',
  };
  readonly sortSettings = { sortBy: 'DataSourceOrder' as const };
  readonly swimlaneSettings = {
    keyField: 'swimlaneKey',
    textField: 'swimlaneText',
    showItemCount: true,
    sortDirection: 'Ascending' as const,
  };

  onCardClick(args: CardClickEventArgs): void {
    this.selectedEntry.set(args.data as unknown as WaitlistEntryDto);
    this.aiOpen.set(false);
  }

  onDragStop(args: DragEventArgs): void {
    const raw = Array.isArray(args.data) ? args.data[0] : args.data;
    const dropped = raw as unknown as WaitlistEntryDto;
    if (dropped?.status === 'Matched') {
      args.cancel = true;
      this.slotEntry.set(dropped);
    }
  }

  onDepartmentChange(value: string | null): void {
    this.departmentFilter.set(value ?? '');
    this.waitlistState.refresh();
  }

  onUrgencyChange(value: string | null): void {
    this.urgencyFilter.set(value ?? '');
  }

  onSortChange(value: string | null): void {
    this.sortDir.set((value as 'asc' | 'desc') ?? 'desc');
  }

  clearUrgencyFilter(): void {
    this.urgencyFilter.set('');
  }

  removeSelected(): void {
    const entry = this.selectedEntry();
    if (!entry) return;
    this.removing.set(true);
    this.healthcare
      .removeWaitlistEntry(entry.waitlistId)
      .pipe(map((res) => okOrThrow(res)))
      .subscribe({
        next: () => {
          this.selectedEntry.set(null);
          this.removing.set(false);
          this.waitlistState.refresh();
        },
        error: () => this.removing.set(false),
      });
  }

  findSlotForSelected(): void {
    const entry = this.selectedEntry();
    if (entry) this.slotEntry.set(entry);
  }

  closeEntry(): void {
    this.selectedEntry.set(null);
  }

  closeSlotDialog(): void {
    this.slotEntry.set(null);
    this.waitlistState.refresh();
  }

  onSlotMatched(): void {
    this.slotEntry.set(null);
    this.selectedEntry.set(null);
    this.waitlistState.refresh();
  }

  runAi(): void {
    this.aiLoading.set(true);
    this.aiOpen.set(true);
    this.selectedEntry.set(null);
    this.healthcare
      .scheduleOptimization({ departmentId: this.departmentFilter() || undefined })
      .pipe(map((res) => (res.status === 'ok' && res.data ? res.data : null)))
      .subscribe({
        next: (result) => {
          this.aiResult.set(result);
          this.aiLoading.set(false);
        },
        error: () => {
          this.aiResult.set(null);
          this.aiLoading.set(false);
        },
      });
  }

  closeAi(): void {
    this.aiOpen.set(false);
  }

  acceptSuggestion(s: Suggestion): void {
    const current = this.aiResult();
    if (current) {
      this.aiResult.set({ ...current, suggestions: current.suggestions.filter((x) => x !== s) });
    }
    this.waitlistState.refresh();
  }

  rejectSuggestion(s: Suggestion): void {
    const current = this.aiResult();
    if (current) {
      this.aiResult.set({ ...current, suggestions: current.suggestions.filter((x) => x !== s) });
    }
  }

  editSuggestion(s: Suggestion): void {
    this.editing.set({ suggestion: s, start: new Date(s.proposedStart), end: new Date(s.proposedEnd) });
  }

  onEditStartChange(value: Date | string | null): void {
    const ed = this.editing();
    if (ed && value) this.editing.set({ ...ed, start: new Date(value) });
  }

  onEditEndChange(value: Date | string | null): void {
    const ed = this.editing();
    if (ed && value) this.editing.set({ ...ed, end: new Date(value) });
  }

  saveEdit(): void {
    const ed = this.editing();
    if (!ed) return;
    const current = this.aiResult();
    if (current) {
      this.aiResult.set({
        ...current,
        suggestions: current.suggestions.map((x) =>
          x === ed.suggestion ? { ...x, proposedStart: ed.start.toISOString(), proposedEnd: ed.end.toISOString() } : x
        ),
      });
    }
    this.editing.set(null);
  }

  cancelEdit(): void {
    this.editing.set(null);
  }

  retry(): void {
    this.waitlistState.refresh();
  }

  daysWaiting(iso: string): number {
    return daysWaiting(iso);
  }

  formatDateRange(start?: string | null, end?: string | null): string {
    return `${fmtDate(start)} – ${fmtDate(end)}`;
  }

  confidenceBadge = confidenceBadge;
  fmtTime = fmtTime;

  get editStart(): Date {
    return this.editing()?.start ?? new Date();
  }

  get editEnd(): Date {
    return this.editing()?.end ?? new Date();
  }

  get editMin(): Date {
    return this.editStart;
  }
}

