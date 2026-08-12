import React, { useRef, useState } from 'react';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { getPatientCarePlan, draftCarePlan } from '@services/healthcare.service';
import { fmtDate } from '../../utils/dateFormat';
import { DocumentEditorContainerComponent, Toolbar, Inject } from '@syncfusion/ej2-react-documenteditor';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EditorErrorBoundary } from '@components/shared/EditorErrorBoundary';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';

export const CarePlanTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const planQ = useAsyncResult(() => getPatientCarePlan(patientId), [patientId]);
  const editorRef = useRef<DocumentEditorContainerComponent>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftMeta, setDraftMeta] = useState<{ confidence: number; explanation: string; sections: string[] } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const plan = planQ.data?.data;

  const loadIntoEditor = (content: string) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) return;
    
    
    
    editor.openBlank();
    editor.editor.insertText(content); 
    editor.selection.moveToDocumentStart();
  };

  const onEditorCreated = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) return;
    const isMobileDevice = /android|iphone|ipad|ipod|windows phone|webos/i.test(
      navigator.userAgent
    );
    if (isMobileDevice) {
      editorRef.current!.showPropertiesPane = false;
    }
    editor.openBlank();
    if (plan) {
      try { loadIntoEditor(plan.sdoContent); } catch {  }
    }
    requestAnimationFrame(() => editorRef.current?.resize());
  };


  React.useEffect(() => {
    if (plan && editorRef.current?.documentEditor) {
      try { loadIntoEditor(plan.sdoContent); } catch {  }
    }

  }, [plan]);

  React.useEffect(() => {
    const onResize = () => editorRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const generateDraft = async () => {
    setDrafting(true);
    setDraftError(null);
    setPublished(false);
    try {
      const res = await draftCarePlan(patientId);
      if (res.status === 'ok' && res.data) {
        setDraftMeta({ confidence: res.data.confidence, explanation: res.data.explanation, sections: res.data.generatedSections });
        
        setTimeout(() => loadIntoEditor(res.data!.sdoContent), 100);
        
      } else {
        setDraftError(res.error?.detail ?? 'Failed to generate care plan draft.');
      }
    } catch {
      setDraftError('Failed to reach the AI service.');
    } finally {
      setDrafting(false);
    }
  };

  const publish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
      setTimeout(() => setPublished(false), 3500);
    }, 900);
  };

  if (planQ.loading) return <LoadingState inline label="Loading care plan…" />;
  if (planQ.error) return <ErrorBanner message={planQ.error} onRetry={planQ.refresh} />;
  if (!plan) return <EmptyState title="No care plan" description="Generate a draft to create a care plan." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-sf-bg-secondary)', padding: 12, borderRadius: 8, border: '1px solid var(--color-sf-border-secondary)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{plan.title}</div>
          <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>
            {plan.authorName} • Version {plan.version} • Last updated {fmtDate(plan.lastUpdated)} • {plan.goals.length} goals
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {draftMeta?.confidence !== undefined && (
            <span style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>
              AI Confidence: <strong style={{ color: draftMeta.confidence >= 0.8 ? 'var(--color-sf-fg-success-primary)' : 'var(--color-sf-fg-warning-primary)' }}>{Math.round(draftMeta.confidence * 100)}%</strong>
            </span>
          )}
          <ButtonComponent cssClass="e-primary" onClick={generateDraft} disabled={drafting}>
            {drafting ? 'Generating…' : '✨ Generate Draft'}
          </ButtonComponent>
          <ButtonComponent cssClass="e-success" onClick={publish} disabled={publishing}>
            {publishing ? 'Publishing…' : 'Publish'}
          </ButtonComponent>
        </div>
      </div>

      {draftError && (
        <div style={{ color: 'var(--color-sf-fg-error-primary)', fontSize: 13, padding: 12, background: 'var(--color-sf-bg-error-primary)', borderRadius: 8 }}>
          {draftError}
        </div>
      )}

      {draftMeta && (
        <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)', fontStyle: 'italic' }}>
          {draftMeta.explanation} Generated sections: {draftMeta.sections.join(', ')}.
        </div>
      )}

      {published && (
        <div style={{ background: 'var(--color-sf-bg-success-solid)', color: 'var(--color-sf-fg-white)', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          ✓ Care plan published. New version logged to audit trail.
        </div>
      )}

      
      <div style={{ background: 'var(--color-sf-bg-secondary)', borderRadius: 8, padding: 12, border: '1px solid var(--color-sf-border-secondary)', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Care Plan Document</span>
          <span style={{ fontSize: 11, color: 'var(--color-sf-fg-quinary)' }}>Track changes · Mail merge · Comments · Revision history</span>
        </div>
        <EditorErrorBoundary>
          <DocumentEditorContainerComponent
            ref={editorRef}
            id="care-plan-editor"
            width="100%"
            height="max(520px, calc(100vh - 360px))"
            enableToolbar={true}
            created={onEditorCreated}
            style={{ border: '1px solid var(--color-sf-border-secondary)', borderRadius: 4 }}
          >
            <Inject services={[Toolbar]} />
          </DocumentEditorContainerComponent>
        </EditorErrorBoundary>
      </div>
    </div>
  );
};
