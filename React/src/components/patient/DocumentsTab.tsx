import React, { useState } from 'react';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { getPatientDocuments, summarizeDocument, getPatientDocumentPdfUrl } from '@services/healthcare.service';
import { apiBaseUrl } from '@services/apiClient';
import { fmtDateTime } from '../../utils/dateFormat';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Selection,
} from '@syncfusion/ej2-react-grids';
import { PdfViewerComponent, Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView, ThumbnailView, Print, TextSelection, TextSearch, Annotation, FormFields, FormDesigner } from '@syncfusion/ej2-react-pdfviewer';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';
import { StatusBadge } from '@components/shared/StatusBadge';
import { AiAssistSidebar, type AiRecommendation, type AiTrigger } from '@components/patient/AiAssistSidebar';
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import type { DocumentDto, LabSummaryResultDto } from '@models/dtos';

export interface DocumentsTabAiHooks {
  sidebarRef: React.MutableRefObject<SidebarComponent | null>;
  onTriggerAi: (trigger: AiTrigger) => void;
}

export const DocumentsTab: React.FC<{ patientId: string; aiHooks?: DocumentsTabAiHooks }> = ({ patientId, aiHooks }) => {
  const docsQ = useAsyncResult(() => getPatientDocuments(patientId), [patientId]);
  const [selected, setSelected] = useState<DocumentDto | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<LabSummaryResultDto | null>(null);
  const [aiRecs, setAiRecs] = useState<AiRecommendation[]>([]);

  const docs = docsQ.data?.data ?? [];

  const onTrigger = async (t: AiTrigger) => {
    if (t.kind !== 'lab-summary' || !selected) return;
    setAiLoading(true);
    setAiError(null);
    setAiSummary(null);
    setAiRecs([]);
    try {
      const res = await summarizeDocument(patientId, selected.documentId);
      if (res.status === 'ok' && res.data) {
        setAiSummary(res.data);
        setAiRecs(res.data.recommendations.map((r, i) => ({
          id: `${selected.documentId}-${i}`,
          title: r.title,
          rationale: r.rationale,
          severity: (r.severity === 'Critical' ? 'Critical' : r.severity === 'Warning' ? 'Warning' : 'Info') as AiRecommendation['severity'],
        })));
      } else {
        setAiError(res.error?.detail ?? 'AI summarization failed.');
      }
    } catch {
      setAiError('Failed to reach the AI service.');
    } finally {
      setAiLoading(false);
    }
    aiHooks?.onTriggerAi(t);
    aiHooks?.sidebarRef.current?.show();
  };

  const onAccept = (rec: AiRecommendation) => {
    setAiRecs((prev) => prev.map((r) => (r.id === rec.id ? { ...r, accepted: true } : r)));
  };
  const onReject = (rec: AiRecommendation) => {
    setAiRecs((prev) => prev.map((r) => (r.id === rec.id ? { ...r, rejected: true } : r)));
  };
  const onClose = () => {
    aiHooks?.sidebarRef.current?.hide();
  };

  if (docsQ.loading) return <LoadingState inline label="Loading documents…" />;
  if (docsQ.error) return <ErrorBanner message={docsQ.error} onRetry={docsQ.refresh} />;
  if (docs.length === 0) return <EmptyState title="No documents" description="No documents on file for this patient." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="responsive-collapse-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>

        <div style={{ minWidth: 0, overflowX: 'auto' }}>
          <GridComponent
            dataSource={docs as unknown as { [key: string]: object }[]}
            allowPaging
            pageSettings={{ pageSize: 8 }}
            allowSorting
            rowSelected={(e: { data: DocumentDto }) => setSelected(e.data)}
            selectedRowIndex={selected ? docs.findIndex((d) => d.documentId === selected.documentId) : -1}
          >
            <ColumnsDirective>
              <ColumnDirective field="name" headerText="Document" width="140" />
              <ColumnDirective
                field="uploadedDate"
                headerText="Uploaded"
                width="180"
                template={(p: DocumentDto) => <>{fmtDateTime(p.uploadedDate)}</>}
              />
              <ColumnDirective field="status" headerText="Status" width="90" template={(p: DocumentDto) => <StatusBadge status={p.status} />} />
            </ColumnsDirective>
            <Inject services={[Page, Sort, Selection]} />
          </GridComponent>
        </div>

        
        <div style={{ background: 'var(--color-sf-bg-secondary)', borderRadius: 8, padding: 12, border: '1px solid var(--color-sf-border-secondary)', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          {!selected ? (
            <EmptyState title="Select a document" description="Choose a row on the left to preview the PDF and demonstrate search, annotation, bookmark, and thumbnail navigation." />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>
                    {selected.providerName} • {fmtDateTime(selected.uploadedDate)} • {selected.pageCount} page(s) • {(selected.sizeBytes / 1024).toFixed(0)} KB
                  </div>
                </div>
                {selected.type === 'Lab Report' && (
                  <ButtonComponent cssClass="e-primary" onClick={() => onTrigger({ kind: 'lab-summary', title: 'Lab Report AI Summary', payload: selected.documentId })}>
                    ✨ Summarize
                  </ButtonComponent>
                )}
              </div>
              <div style={{ flex: 1, border: '1px solid var(--color-sf-border-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                <PdfViewerComponent
                  documentPath={getPatientDocumentPdfUrl(patientId, selected.documentId)}
                  resourceUrl="https://cdn.syncfusion.com/ej2/33.2.15/dist/ej2-pdfviewer-lib"
                  enableBookmark={true}
                  enableThumbnail={true}
                  enableTextSelection={true}
                  enableTextSearch={true}
                  enablePrint={true}
                  enableNavigation={true}
                  enableMagnification={true}
                  enableAnnotation={true}
                  enableFormFields={true}
                  style={{ height: 'max(480px, calc(100vh - 320px))', width: '100%' }}
                >
                  <Inject services={[Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView, ThumbnailView, Print, TextSelection, TextSearch, Annotation, FormFields, FormDesigner]} />
                </PdfViewerComponent>
              </div>
            </>
          )}
        </div>
      </div>

      
      {aiHooks?.sidebarRef && (
        <AiAssistSidebar
          sidebarRef={aiHooks.sidebarRef}
          trigger={aiLoading || aiSummary ? { kind: 'lab-summary', title: 'Lab Report AI Summary' } : null}
          loading={aiLoading}
          error={aiError}
          summary={aiSummary?.summary}
          explanation={aiSummary?.explanation}
          confidence={aiSummary?.confidence}
          recommendations={aiRecs}
          onAccept={onAccept}
          onReject={onReject}
          onClose={onClose}
        />
      )}
    </div>
  );
};
