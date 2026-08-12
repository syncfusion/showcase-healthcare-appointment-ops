import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  effect,
  ViewChild,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DocumentEditorContainerModule,
  DocumentEditorContainerComponent,
  ToolbarService,
} from '@syncfusion/ej2-angular-documenteditor';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { fmtDate } from '../../core/utils/date-format';
import { map } from 'rxjs/operators';
import type { CarePlanDto } from '../../core/models/dtos';

interface DraftMeta {
  confidence: number;
  explanation: string;
  sections: string[];
}

@Component({
  selector: 'app-patient-care-plan-tab',
  standalone: true,
  imports: [
    CommonModule,
    DocumentEditorContainerModule,
    ButtonModule,
    ErrorBannerComponent,
    EmptyStateComponent,
    LoadingStateComponent,
  ],
  providers: [ToolbarService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-care-plan-tab.component.html',
  styleUrl: './patient-care-plan-tab.component.scss',
})
export class PatientCarePlanTabComponent {
  private healthcare = inject(HealthcareService);

  private _patientId = signal<string>('');

  @Input({ required: true })
  set patientId(value: string) {
    this._patientId.set(value);
    if (value) this.planState.refresh();
  }

  @ViewChild('editor') editorObj?: DocumentEditorContainerComponent;

  private readonly planState = createAsyncResult<CarePlanDto>(() =>
    this.healthcare
      .getPatientCarePlan(this._patientId())
      .pipe(map((res) => okOrThrow(res)))
  , { immediate: false, destroyRef: inject(DestroyRef) });

  readonly plan = computed<CarePlanDto | undefined>(() => this.planState.data);
  readonly loading = computed(() => this.planState.loading);
  readonly error = computed(() => this.planState.error);
  readonly retry = () => this.planState.refresh();

  readonly drafting = signal(false);
  readonly draftError = signal<string | null>(null);
  readonly draftMeta = signal<DraftMeta | null>(null);
  readonly publishing = signal(false);
  readonly published = signal(false);

  readonly lastUpdatedLabel = computed(() => {
    const plan = this.plan();
    if (!plan) return '';
    return fmtDate(plan.lastUpdated);
  });

  readonly confidenceColor = computed(() => {
    const meta = this.draftMeta();
    if (!meta) return 'var(--color-sf-fg-warning-primary)';
    return meta.confidence >= 0.8
      ? 'var(--color-sf-fg-success-primary)'
      : 'var(--color-sf-fg-warning-primary)';
  });

  readonly confidencePct = computed(() => {
    const meta = this.draftMeta();
    return meta ? Math.round(meta.confidence * 100) : 0;
  });

  constructor() {
    effect(() => {
      const plan = this.plan();
      if (plan && this.editorObj?.documentEditor) {
        try {
          this.loadIntoEditor(plan.sdoContent);
        } catch {
        }
      }
    });
  }

  private loadIntoEditor(content: string): void {
    const editor = this.editorObj?.documentEditor;
    if (!editor) return;
    editor.openBlank();
    editor.editor.insertText(content);
    editor.selection.moveToDocumentStart();
  }

  onEditorCreated(): void {
    const editor = this.editorObj?.documentEditor;
    if (!editor) return;
    const isMobileDevice = /android|iphone|ipad|ipod|windows phone|webos/i.test(
      navigator.userAgent
    );
    if (isMobileDevice) {
      this.editorObj!.showPropertiesPane = false;
    }
    editor.openBlank();
    const plan = this.plan();
    if (plan) {
      try {
        this.loadIntoEditor(plan.sdoContent);
      } catch {
      }
    }
    requestAnimationFrame(() => this.editorObj?.resize());
  }

  generateDraft(): void {
    if (this.drafting()) return;
    this.drafting.set(true);
    this.draftError.set(null);
    this.published.set(false);
    this.healthcare
      .draftCarePlan(this._patientId())
      .pipe(map((res) => okOrThrow(res)))
      .subscribe({
        next: (data) => {
          this.draftMeta.set({
            confidence: data.confidence,
            explanation: data.explanation,
            sections: data.generatedSections,
          });
          setTimeout(() => this.loadIntoEditor(data.sdoContent), 100);
          this.drafting.set(false);
        },
        error: (err: unknown) => {
          this.draftError.set(
            err instanceof Error ? err.message : 'Failed to generate care plan draft.'
          );
          this.drafting.set(false);
        },
      });
  }

  publish(): void {
    if (this.publishing()) return;
    this.publishing.set(true);
    setTimeout(() => {
      this.publishing.set(false);
      this.published.set(true);
      setTimeout(() => this.published.set(false), 3500);
    }, 900);
  }
}
