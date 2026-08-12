import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  GridModule,
  PageService,
  SortService,
  FilterService,
  ToolbarService,
  ExcelExportService,
  ColumnChooserService,
  SearchService,
  GridComponent,
} from '@syncfusion/ej2-angular-grids';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { fmtDateTime } from '../../core/utils/date-format';
import type { PatientSummaryDto } from '../../core/models/dtos';

function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatApptDate(value?: string | null): string {
  return fmtDateTime(value);
}

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [
    CommonModule,
    GridModule,
    ButtonModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
  ],
  providers: [PageService, SortService, FilterService, ToolbarService, ExcelExportService, ColumnChooserService, SearchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.scss',
})
export class PatientsPageComponent {
  private healthcare = inject(HealthcareService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  @ViewChild('grid') grid?: GridComponent;

  readonly searchInput = signal('');
  readonly items = signal<PatientSummaryDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly initialLoad = signal(true);

  readonly pageSettings = { pageSizes: [5, 10, 25, 50, 100], pageSize: 50 };
  readonly toolbar = ['Search', 'ColumnChooser'];
  readonly filterSettings = { type: 'Excel' as const };
  readonly searchSettings = { fields: ['firstName', 'lastName', 'medicalRecordNumber', 'phoneNumber', 'primaryCareProviderName'], operator: 'contains', ignoreCase: true };

  private readonly search$ = new Subject<string>();

  readonly empty = computed(() => !this.loading() && this.items().length === 0);

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          this.loading.set(true);
          this.error.set(null);
          return this.healthcare.listPatients(q || undefined, 0, 200).pipe(
            map((res) => okOrThrow(res)),
            catchError((err: unknown) => {
              this.error.set(err instanceof Error ? err.message : 'Failed to load patients');
              return of({ items: [] as PatientSummaryDto[], paging: { offset: 0, limit: 0, total: 0 } });
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.items.set(res.items ?? []);
        this.loading.set(false);
        this.initialLoad.set(false);
      });

    this.search$.next('');
  }

  onSearchInput(value: string): void {
    this.searchInput.set(value);
    this.search$.next(value);
  }

  retry(): void {
    this.search$.next(this.searchInput());
  }

  ageOf(props: PatientSummaryDto): number | null {
    return calcAge(props.dateOfBirth);
  }

  patientSubline(props: PatientSummaryDto): string {
    const age = this.ageOf(props);
    return age != null
      ? `${props.medicalRecordNumber} · Age ${age}`
      : props.medicalRecordNumber;
  }

  initials(props: PatientSummaryDto): string {
    return ((props.firstName?.[0] ?? '') + (props.lastName?.[0] ?? '')).toUpperCase();
  }

  formatAppt(value: string | null): string {
    return formatApptDate(value);
  }

  fullName(props: PatientSummaryDto): string {
    return `${props.firstName} ${props.lastName}`;
  }

  goToDetail(id: string): void {
    this.router.navigate(['/patients', id]);
  }

  onRowSelected(data: PatientSummaryDto | null): void {
    const id = data?.patientId;
    if (id) this.router.navigate(['/patients', id]);
  }

}
