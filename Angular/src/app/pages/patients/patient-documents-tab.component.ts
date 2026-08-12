import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  ViewChild,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GridModule,
  PageService,
  SortService,
  SelectionService
} from '@syncfusion/ej2-angular-grids';
import {
  PdfViewerModule,
  ToolbarService,
  MagnificationService,
  NavigationService,
  LinkAnnotationService,
  BookmarkViewService,
  ThumbnailViewService,
  PrintService,
  TextSelectionService,
  TextSearchService,
  AnnotationService,
  FormFieldsService,
  FormDesignerService,
  PdfViewerComponent,
} from '@syncfusion/ej2-angular-pdfviewer';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { SidebarModule, SidebarComponent } from '@syncfusion/ej2-angular-navigations';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import type { DocumentDto, LabSummaryResultDto } from '../../core/models/dtos';

export interface AiRecommendation {
  id: string;
  title: string;
  rationale: string;
  severity: 'Critical' | 'Warning' | 'Info';
  accepted?: boolean;
  rejected?: boolean;
}

@Component({
  selector: 'app-patient-documents-tab',
  standalone: true,
  imports: [
    CommonModule,
    GridModule,
    PdfViewerModule,
    ButtonModule,
    SidebarModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
  ],
  providers: [
    PageService,
    SortService,
    SelectionService,
    ToolbarService,
    MagnificationService,
    NavigationService,
    LinkAnnotationService,
    BookmarkViewService,
    ThumbnailViewService,
    PrintService,
    TextSelectionService,
    TextSearchService,
    AnnotationService,
    FormFieldsService,
    FormDesignerService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-documents-tab.component.html',
  styleUrl: './patient-documents-tab.component.scss',
})
export class PatientDocumentsTabComponent {
  private healthcare = inject(HealthcareService);

  private _patientId = signal<string>('');

  @Input({ required: true })
  set patientId(value: string) {
    this._patientId.set(value);
    if (value) this.docsState.refresh();
  }

  @ViewChild('sidebar') sidebar?: SidebarComponent;
  @ViewChild('pdfViewer') pdfViewer?: PdfViewerComponent;

  readonly selected = signal<DocumentDto | null>(null);
  readonly aiLoading = signal(false);
  readonly aiError = signal<string | null>(null);
  readonly aiSummary = signal<LabSummaryResultDto | null>(null);
  readonly aiRecs = signal<AiRecommendation[]>([]);

  private readonly docsState = createAsyncResult<DocumentDto[]>(() =>
    this.healthcare
      .getPatientDocuments(this._patientId())
      .pipe(map((res) => okOrThrow(res)))
  , { immediate: false, destroyRef: inject(DestroyRef) });

  readonly docs = computed(() => this.docsState.data ?? []);
  readonly loading = computed(() => this.docsState.loading);
  readonly error = computed(() => this.docsState.error);
  readonly retryDocs = () => this.docsState.refresh();
  readonly pdfUrl = computed(() => {
    const doc = this.selected();
    const patientId = this._patientId();
    if (!doc || !patientId) return '';
    return this.healthcare.getPatientDocumentPdfUrl(patientId, doc.documentId);
  });

  readonly gridPageSettings = { pageSize: 8 };

  onRowSelected(args: { data: DocumentDto }): void {
    this.selected.set(args.data ?? null);
  }

  summarize(): void {
    const doc = this.selected();
    const patientId = this._patientId();
    if (!doc || doc.type !== 'Lab Report') return;
    this.aiLoading.set(true);
    this.aiError.set(null);
    this.aiSummary.set(null);
    this.aiRecs.set([]);
    this.sidebar?.show();

    this.healthcare
      .summarizeDocument(patientId, doc.documentId)
      .pipe(map((res) => okOrThrow(res)))
      .subscribe({
        next: (result) => {
          this.aiSummary.set(result);
          this.aiRecs.set(
            result.recommendations.map((r, i) => ({
              id: `${doc.documentId}-${i}`,
              title: r.title,
              rationale: r.rationale,
              severity: (r.severity === 'Critical'
                ? 'Critical'
                : r.severity === 'Warning'
                  ? 'Warning'
                  : 'Info') as AiRecommendation['severity'],
            }))
          );
          this.aiLoading.set(false);
        },
        error: (err: unknown) => {
          this.aiError.set(err instanceof Error ? err.message : 'AI summarization failed.');
          this.aiLoading.set(false);
        },
      });
  }

  accept(rec: AiRecommendation): void {
    this.aiRecs.update((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, accepted: true } : r))
    );
  }

  reject(rec: AiRecommendation): void {
    this.aiRecs.update((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, rejected: true } : r))
    );
  }

  closeSidebar(): void {
    this.sidebar?.hide();
  }

  fileSize(bytes: number): string {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
}
