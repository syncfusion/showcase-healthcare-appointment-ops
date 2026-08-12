import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GridModule,
  PageService,
  SortService,
  ToolbarService,
  ExcelExportService,
  GridComponent
} from '@syncfusion/ej2-angular-grids';
import { TabModule } from '@syncfusion/ej2-angular-navigations';
import { ProgressBarModule } from '@syncfusion/ej2-angular-progressbar';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { fmtDate as fmtDateHelper } from '../../core/utils/date-format';
import type { MedicationDto, MedicationHistoryDto } from '../../core/models/dtos';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-patient-medications-tab',
  standalone: true,
  imports: [
    CommonModule,
    GridModule,
    TabModule,
    ProgressBarModule,
    ButtonModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
  ],
  providers: [PageService, SortService, ToolbarService, ExcelExportService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-medications-tab.component.html',
  styleUrl: './patient-medications-tab.component.scss',
})
export class PatientMedicationsTabComponent {
  private healthcare = inject(HealthcareService);

  private _patientId = signal<string>('');

  @Input({ required: true })
  set patientId(value: string) {
    this._patientId.set(value);
    if (value) this.medsState.refresh();
  }

  @ViewChild('grid') grid?: GridComponent;

  readonly subTab = signal<'active' | 'history' | 'refills'>('active');
  readonly toast = signal<string | null>(null);

  private readonly medsState = createAsyncResult<MedicationHistoryDto>(() =>
    this.healthcare
      .getPatientMedications(this._patientId())
      .pipe(map((res) => okOrThrow(res)))
  , { immediate: false, destroyRef: inject(DestroyRef) });

  readonly data = computed<MedicationHistoryDto | undefined>(() => this.medsState.data);
  readonly loading = computed(() => this.medsState.loading);
  readonly error = computed(() => this.medsState.error);
  readonly retryMeds = () => this.medsState.refresh();
  readonly toolbar = ['ExcelExport'];

  readonly activeColumns = [
    { field: 'medicationName', headerText: 'Medication', width: 160 },
    { field: 'dosage', headerText: 'Dosage', width: 100 },
    { field: 'frequency', headerText: 'Frequency', width: 130 },
    { field: 'route', headerText: 'Route', width: 100 },
    { field: 'prescriberName', headerText: 'Prescriber', width: 160 },
    { field: 'startDate', headerText: 'Started', width: 120, format: 'yMd' },
    { field: 'refillsRemaining', headerText: 'Refills Left', width: 110 },
    { field: 'pharmacy', headerText: 'Pharmacy', width: 140 },
    { field: 'status', headerText: 'Status', width: 110 },
    { headerText: 'Action', width: 140 },
  ];

  readonly historyColumns = [
    { field: 'medicationName', headerText: 'Medication', width: 160 },
    { field: 'dosage', headerText: 'Dosage', width: 100 },
    { field: 'frequency', headerText: 'Frequency', width: 130 },
    { field: 'startDate', headerText: 'Started', width: 120, format: 'yMd' },
    { field: 'endDate', headerText: 'Stopped', width: 120, format: 'yMd' },
    { field: 'stopReason', headerText: 'Stop Reason', width: 180 },
    { field: 'prescriberName', headerText: 'Prescriber', width: 160 },
    { field: 'status', headerText: 'Status', width: 120 },
  ];

  readonly refillColumns = [
    { field: 'medicationName', headerText: 'Medication', width: 180 },
    { field: 'refillDate', headerText: 'Refill Date', width: 150, format: 'yMd' },
    { field: 'status', headerText: 'Status', width: 120 },
  ];

  readonly pageSettings = { pageSize: 10 };

  onSubTabSelecting(args: { selectingIndex: number }): void {
    const keys: ('active' | 'history' | 'refills')[] = ['active', 'history', 'refills'];
    const key = keys[args.selectingIndex];
    if (key) this.subTab.set(key);
  }

  requestRefill(m: MedicationDto): void {
    this.toast.set(`Refill request submitted for ${m.medicationName} (${m.dosage}).`);
    window.setTimeout(() => this.toast.set(null), 3500);
  }

  adherenceColor(pct: number): string {
    if (pct >= 80) return 'var(--color-sf-fg-success-primary)';
    if (pct >= 50) return 'var(--color-sf-fg-warning-primary)';
    return 'var(--color-sf-fg-error-primary)';
  }

  adherenceLabel(pct: number): string {
    if (pct >= 80) return 'On track';
    if (pct >= 50) return 'Monitor — below target';
    return 'Outreach recommended';
  }

  fmtDate(iso?: string | null): string {
    return fmtDateHelper(iso);
  }

  onToolbarClick(args: { item?: { id?: string } }): void {
    if (args.item?.id?.endsWith('_excelexport')) {
      this.grid?.excelExport();
    }
  }
}
