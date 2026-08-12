import React, { useState } from 'react';
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { StatusBadge } from '@components/shared/StatusBadge';

export type AiTriggerKind = 'lab-summary' | 'care-plan-draft' | 'med-interactions';

export interface AiTrigger {
  kind: AiTriggerKind;
  title: string;
  payload?: unknown;
}

export interface AiRecommendation {
  id: string;
  title: string;
  rationale: string;
  severity: 'Info' | 'Warning' | 'Critical';
  accepted?: boolean;
  rejected?: boolean;
}

interface AiAssistSidebarProps {
  sidebarRef: React.MutableRefObject<SidebarComponent | null>;
  trigger: AiTrigger | null;
  loading: boolean;
  error: string | null;
  summary?: string;
  explanation?: string;
  confidence?: number;
  recommendations: AiRecommendation[];
  onAccept: (rec: AiRecommendation) => void;
  onReject: (rec: AiRecommendation) => void;
  onClose: () => void;
}

const severityToBadge: Record<AiRecommendation['severity'], string> = {
  Info: 'Active',
  Warning: 'Urgent',
  Critical: 'Emergency',
};

export const AiAssistSidebar: React.FC<AiAssistSidebarProps> = ({
  sidebarRef,
  trigger,
  loading,
  error,
  summary,
  explanation,
  confidence,
  recommendations,
  onAccept,
  onReject,
  onClose,
}) => {
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  return (
    <SidebarComponent
      ref={sidebarRef}
      id="ai-assist-sidebar"
      width="400px"
      position="Right"
      type="Over"
      closeOnDocumentClick={false}
      showBackdrop
      style={{
        background: 'var(--color-sf-bg-primary)',
        borderLeft: '1px solid var(--color-sf-border-secondary)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16, gap: 12 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Assist</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{trigger?.title ?? 'AI Suggestions'}</div>
          </div>
          <ButtonComponent cssClass="e-flat e-small" onClick={onClose}>✕</ButtonComponent>
        </div>

        
        {confidence !== undefined && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>Confidence</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: confidence >= 0.8 ? 'var(--color-sf-bg-success-primary)' : confidence >= 0.6 ? 'var(--color-sf-bg-warning-primary)' : 'var(--color-sf-bg-error-primary)',
              color: confidence >= 0.8 ? 'var(--color-sf-fg-success-primary)' : confidence >= 0.6 ? 'var(--color-sf-fg-warning-primary)' : 'var(--color-sf-fg-error-primary)',
            }}>
              {Math.round(confidence * 100)}%
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-sf-fg-quinary)' }}>
              ✓ {acceptedCount} accepted · ✕ {rejectedCount} rejected
            </span>
          </div>
        )}

        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-sf-fg-tertiary)' }}>
            <div className="spinner" style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid var(--color-sf-border-secondary)', borderTopColor: 'var(--color-sf-bg-brand-solid)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ marginTop: 12, fontSize: 13 }}>Analyzing patient data…</div>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--color-sf-fg-error-primary)', fontSize: 13, padding: 12, background: 'var(--color-sf-bg-error-primary)', borderRadius: 8 }}>
            {error}
          </div>
        )}

        {!loading && !error && summary && (
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--color-sf-bg-secondary)', borderRadius: 8, padding: 12, border: '1px solid var(--color-sf-border-secondary)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Summary</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{summary}</div>
            </div>

            {recommendations.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Recommendations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      rec={rec}
                      onAccept={() => { onAccept(rec); setAcceptedCount((c) => c + 1); }}
                      onReject={() => { onReject(rec); setRejectedCount((c) => c + 1); }}
                    />
                  ))}
                </div>
              </div>
            )}

            {explanation && (
              <div style={{ fontSize: 11, color: 'var(--color-sf-fg-quinary)', fontStyle: 'italic', borderTop: '1px solid var(--color-sf-border-secondary)', paddingTop: 8 }}>
                {explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarComponent>
  );
};

const RecommendationCard: React.FC<{
  rec: AiRecommendation;
  onAccept: () => void;
  onReject: () => void;
}> = ({ rec, onAccept, onReject }) => {
  if (rec.accepted) {
    return (
      <div style={{ background: 'var(--color-sf-bg-success-primary)', border: '1px solid var(--color-sf-border-success)', borderRadius: 8, padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>✓ {rec.title}</span>
          <StatusBadge status="Completed" />
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)', marginTop: 4 }}>Accepted — logged to audit trail</div>
      </div>
    );
  }
  if (rec.rejected) {
    return (
      <div style={{ background: 'var(--color-sf-bg-tertiary)', border: '1px solid var(--color-sf-border-secondary)', borderRadius: 8, padding: 10, opacity: 0.6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>✕ {rec.title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)', marginTop: 4 }}>Dismissed</div>
      </div>
    );
  }
  return (
    <div style={{ background: 'var(--color-sf-bg-primary)', border: '1px solid var(--color-sf-border-secondary)', borderRadius: 8, padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{rec.title}</span>
        <StatusBadge status={severityToBadge[rec.severity]} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)', marginBottom: 8 }}>{rec.rationale}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <ButtonComponent cssClass="e-primary e-small" onClick={onAccept}>Accept</ButtonComponent>
        <ButtonComponent cssClass="e-flat e-small" onClick={onReject}>Reject</ButtonComponent>
      </div>
    </div>
  );
};
