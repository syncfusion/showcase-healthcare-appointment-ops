import React, { useMemo, useState, useRef } from 'react';
import {
  KanbanComponent,
  ColumnsDirective,
  ColumnDirective,
  CardSettingsModel,
  CardClickEventArgs,
  DragEventArgs,
} from '@syncfusion/ej2-react-kanban';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DropDownListComponent, ChangeEventArgs } from '@syncfusion/ej2-react-dropdowns';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { DateTimePickerComponent } from '@syncfusion/ej2-react-calendars';
import { ProgressBarComponent } from '@syncfusion/ej2-react-progressbar';
import { AIAssistViewComponent } from '@syncfusion/ej2-react-interactive-chat';
import { useAsyncResult } from '@hooks/useAsyncResult';
import { listWaitlist, listDepartments, removeWaitlistEntry } from '@services/healthcare.service';
import { withDepartmentLabel } from '../utils/department';
import { fmtDate, fmtTime } from '../utils/dateFormat';
import { scheduleOptimization } from '@services/aiService';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { StatusBadge } from '@components/shared/StatusBadge';
import { LoadingState } from '@components/shared/LoadingState';
import { WaitlistEntryDetail } from '@components/waitlist/WaitlistEntryDetail';
import { SlotMatchDialog } from '@components/waitlist/SlotMatchDialog';
import type { WaitlistEntryDto, ScheduleOptimizationDto, ScheduleOptimizationSuggestionDto } from '@models/dtos';

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

function daysWaiting(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export const WaitlistPage: React.FC = () => {
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [refreshTick, setRefreshTick] = useState(0);

  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntryDto | null>(null);
  const [removing, setRemoving] = useState(false);
  const [slotEntry, setSlotEntry] = useState<WaitlistEntryDto | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<ScheduleOptimizationDto | null>(null);
  const [aiVersion, setAiVersion] = useState(0);
  const [editing, setEditing] = useState<{ suggestion: Suggestion; start: Date; end: Date } | null>(null);

  const kanbanRef = useRef<KanbanComponent>(null);

  const query = useAsyncResult(
    () => listWaitlist(undefined, departmentFilter || undefined),
    [departmentFilter, refreshTick]
  );
  const departmentsQuery = useAsyncResult(() => listDepartments(), []);

  const rawItems = query.data?.data?.items ?? [];

  const items = useMemo(() => {
    const filtered = urgencyFilter ? rawItems.filter((i) => i.urgencyLevel === urgencyFilter) : rawItems.slice();
    filtered.sort((a, b) => (sortDir === 'desc' ? b.priorityScore - a.priorityScore : a.priorityScore - b.priorityScore));
    return filtered.map((i) => {
      const location = i.preferredLocationName ?? '';
      const text = location ? `${i.preferredDepartmentName} — ${location}` : i.preferredDepartmentName;
      return { ...i, swimlaneKey: i.preferredDepartmentId, swimlaneText: text };
    });
  }, [rawItems, urgencyFilter, sortDir]);

  const bumpAi = () => setAiVersion((v) => v + 1);

  const cardSettings: CardSettingsModel = {
    headerField: 'waitlistId',
    contentField: 'patientName',
    template: (data: WaitlistEntryDto) => (
      <div style={{ padding: 8, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.patientName}</div>
        <div style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.requestedAppointmentType} • Priority {data.priorityScore}
        </div>
        {data.preferredProviderName && (
          <div style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.preferredProviderName}
          </div>
        )}
        <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={data.urgencyLevel} />
          <span style={{ fontSize: 11, color: 'var(--color-sf-fg-quinary)' }}>{daysWaiting(data.requestDateTime)}d waiting</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-sf-fg-quinary)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {fmtDate(data.preferredDateRangeStart)} to {fmtDate(data.preferredDateRangeEnd)}
        </div>
      </div>
    ),
  };

  const handleCardClick = (args: CardClickEventArgs) => {
    setSelectedEntry(args.data as unknown as WaitlistEntryDto);
    setAiOpen(false);
  };

  const handleDragStop = (args: DragEventArgs) => {
    const dropped = Array.isArray(args.data) ? args.data[0] : (args.data as any);
    if (dropped?.status === 'Matched' || dropped?.keyField === 'Matched') {
      
      args.cancel = true;
      setSlotEntry(dropped as WaitlistEntryDto);
    }
  };

  const handleRemove = async () => {
    if (!selectedEntry) return;
    setRemoving(true);
    try {
      await removeWaitlistEntry(selectedEntry.waitlistId);
      setSelectedEntry(null);
      setRefreshTick((t) => t + 1);
    } finally {
      setRemoving(false);
    }
  };

  const handleRunAi = async () => {
    setAiLoading(true);
    setAiOpen(true);
    setSelectedEntry(null);
    bumpAi();
    try {
      const res = await scheduleOptimization({ departmentId: departmentFilter || undefined });
      setAiResult(res.status === 'ok' ? res.data ?? null : null);
    } catch {
      setAiResult(null);
    } finally {
      setAiLoading(false);
      bumpAi();
    }
  };

  const acceptSuggestion = (s: Suggestion) => {
    setAiResult((prev) => (prev ? { ...prev, suggestions: prev.suggestions.filter((x) => x !== s) } : prev));
    setRefreshTick((t) => t + 1);
    bumpAi();
  };

  const rejectSuggestion = (s: Suggestion) => {
    setAiResult((prev) => (prev ? { ...prev, suggestions: prev.suggestions.filter((x) => x !== s) } : prev));
    bumpAi();
  };

  const saveEdit = () => {
    if (!editing) return;
    setAiResult((prev) =>
      prev
        ? {
            ...prev,
            suggestions: prev.suggestions.map((x) =>
              x === editing.suggestion
                ? { ...x, proposedStart: editing.start.toISOString(), proposedEnd: editing.end.toISOString() }
                : x
            ),
          }
        : prev
    );
    setEditing(null);
    bumpAi();
  };

  const renderBanner = () => {
    if (aiLoading) {
      return (
        <div style={{ width: '100%', padding: '24px 8px' }}>
          <div style={{ fontSize: 13, color: 'var(--color-sf-fg-secondary)', marginBottom: 12, fontWeight: 600 }}>Analyzing schedule gaps…</div>
          <ProgressBarComponent
            type="Linear"
            height="6"
            width="100%"
            isIndeterminate
            trackColor="var(--color-sf-bg-quaternary)"
            progressColor="var(--color-sf-bg-brand-solid)"
            cornerRadius="Round"
            animation={{ enable: true, duration: 1200 }}
          />
        </div>
      );
    }
    if (!aiResult) {
      return (
        <div style={{ width: '100%' }}>
          <EmptyState title="Ready to optimise" description="Run Optimize Schedule to surface gaps you can fill from the waitlist." />
        </div>
      );
    }
    if (aiResult.suggestions.length === 0) {
      return (
        <div style={{ width: '100%' }}>
          <EmptyState title="No opportunities found" description="The current schedule has no gaps that the waitlist can fill right now." />
        </div>
      );
    }
    const badge = confidenceBadge(aiResult.confidence);
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          title={`${(aiResult.confidence * 100).toFixed(0)}% model confidence`}
          style={{ background: 'var(--color-sf-bg-brand-primary)', border: '1px solid var(--color-sf-border-brand)', borderRadius: 6, padding: 10, fontSize: 12, color: 'var(--color-sf-fg-brand-primary)' }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: badge.bg,
              color: badge.color,
              marginBottom: 6,
            }}
          >
            {badge.label}
          </span>
          <div>{aiResult.explanation}</div>
        </div>
        {aiResult.suggestions.map((s, idx) => (
          <div key={idx} style={{ background: 'var(--color-sf-bg-secondary)', border: '1px solid var(--color-sf-border-secondary)', borderRadius: 6, padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{suggestionTypeLabel[s.type] ?? s.type}</div>
            <div style={{ fontSize: 12, color: 'var(--color-sf-fg-secondary)', marginBottom: 4 }}>
              {s.providerName} • {fmtTime(s.proposedStart)} – {fmtTime(s.proposedEnd)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', marginBottom: 6 }}>{s.reason}</div>
            <div style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', marginBottom: 8 }}>
              ▲ Utilisation +{(s.estimatedUtilizationGain * 100).toFixed(0)}% · No-show −{(s.estimatedNoShowReduction * 100).toFixed(0)}%
            </div>
            {s.waitlistMatches.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-sf-fg-secondary)' }}>Suggested patients:</div>
                {s.waitlistMatches.map((m) => (
                  <div key={m.waitlistId} style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{m.patientName}</span>
                    <span>{(m.fitScore * 100).toFixed(0)}% fit</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <ButtonComponent cssClass="e-success e-small" onClick={() => acceptSuggestion(s)}>
                Accept
              </ButtonComponent>
              <ButtonComponent
                cssClass="e-outline e-small"
                onClick={() => setEditing({ suggestion: s, start: new Date(s.proposedStart), end: new Date(s.proposedEnd) })}
              >
                Edit
              </ButtonComponent>
              <ButtonComponent cssClass="e-danger e-small e-outline" onClick={() => rejectSuggestion(s)}>
                Reject
              </ButtonComponent>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ width: 180 }}>
              <DropDownListComponent
                dataSource={withDepartmentLabel(departmentsQuery.data?.data ?? []) as any}
                fields={{ text: 'departmentName', value: 'departmentId', groupBy: 'locationName' }}
                placeholder="All Departments"
                change={(e: ChangeEventArgs) => setDepartmentFilter((e.value as string) ?? '')}
                value={departmentFilter}
                allowFiltering
                width="100%"
                sortOrder='Ascending'
              />
            </div>
            <div style={{ width: 150 }}>
              <DropDownListComponent
                dataSource={urgencyOptions as any}
                fields={{ text: 'text', value: 'value' }}
                value={urgencyFilter}
                change={(e: ChangeEventArgs) => setUrgencyFilter((e.value as string) ?? '')}
                width="100%"
                sortOrder='Ascending'
              />
            </div>
            <div style={{ width: 175 }}>
              <DropDownListComponent
                dataSource={sortOptions as any}
                fields={{ text: 'text', value: 'value' }}
                value={sortDir}
                change={(e: ChangeEventArgs) => setSortDir((e.value as 'asc' | 'desc') ?? 'desc')}
                width="100%"
                sortOrder='Ascending'
              />
            </div>
            <ButtonComponent cssClass="e-primary" iconCss="e-icons e-assistview-icon" onClick={handleRunAi} disabled={aiLoading}>
              {aiLoading ? 'Optimizing…' : 'Optimize Schedule'}
            </ButtonComponent>
          </div>
        </div>

        {query.error && <ErrorBanner message={query.error} onRetry={query.refresh} />}

        {query.loading && !query.data ? (
          <LoadingState label="Loading waitlist…" />
        ) : items.length === 0 ? (
          <EmptyState
            title={urgencyFilter ? 'No matching entries' : 'Waitlist is empty'}
            description={urgencyFilter ? 'No waitlist entries match the selected urgency.' : 'No patients are currently waiting for appointments.'}
            actionLabel={urgencyFilter ? 'Clear filter' : undefined}
            onAction={urgencyFilter ? () => setUrgencyFilter('') : undefined}
          />
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <KanbanComponent
              ref={kanbanRef}
              cssClass="waitlist-kanban"
              dataSource={items as any}
              keyField="status"
              cardSettings={cardSettings}
              cardClick={handleCardClick}
              dragStop={handleDragStop}
              sortSettings={{ sortBy: 'DataSourceOrder' }}
              swimlaneSettings={{ keyField: 'swimlaneKey', textField: 'swimlaneText', showItemCount: true, sortDirection: 'Ascending' }}
              width="100%"
              height="100%"
            >
              <ColumnsDirective>
                <ColumnDirective headerText="Open" keyField="Open" />
                <ColumnDirective headerText="Matched" keyField="Matched" />
                <ColumnDirective headerText="Closed Expired" keyField="ClosedExpired,Expired" />
                <ColumnDirective headerText="Closed Cancelled" keyField="ClosedCancelled,Cancelled" />
              </ColumnsDirective>
            </KanbanComponent>
          </div>
        )}
      </div>

      {aiOpen ? (
        <div className="waitlist-ai-panel" style={{ width: 400, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="waitlist-ai-header">Schedule Optimizer</div>
          <AIAssistViewComponent
            key={`ai-${aiVersion}`}
            cssClass="waitlist-ai"
            width="100%"
            height="100%"
            bannerTemplate={renderBanner}
            footerTemplate={() => <span style={{ display: 'none' }} />}
          />
          <ButtonComponent cssClass="e-outline e-small" style={{ marginTop: 8 }} onClick={() => setAiOpen(false)}>
            Close optimizer
          </ButtonComponent>
        </div>
      ) : selectedEntry ? (
        <WaitlistEntryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onFindSlot={() => setSlotEntry(selectedEntry)}
          onRemove={handleRemove}
          removing={removing}
        />
      ) : null}

      {slotEntry && (
        <SlotMatchDialog
          entry={slotEntry}
          onClose={() => {
            setSlotEntry(null);            
            setRefreshTick((t) => t + 1);
          }}
          onMatched={() => {
            setSlotEntry(null);
            setSelectedEntry(null);
            setRefreshTick((t) => t + 1);
          }}
        />
      )}

      {editing && (
        <DialogComponent
          header="Edit suggestion"
          visible
          width="380px"
          isModal
          showCloseIcon
          close={() => setEditing(null)}
          target="#root"
        >
          <div style={{ padding: '6px 2px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-sf-fg-secondary)' }}>Proposed start</label>
              <DateTimePickerComponent
                value={editing.start}
                format="MM/dd/yyyy h:mm a"
                change={(e: any) => e.value && setEditing((prev) => (prev ? { ...prev, start: e.value as Date } : prev))}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-sf-fg-secondary)' }}>Proposed end</label>
              <DateTimePickerComponent
                value={editing.end}
                min={editing.start}
                format="MM/dd/yyyy h:mm a"
                change={(e: any) => e.value && setEditing((prev) => (prev ? { ...prev, end: e.value as Date } : prev))}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <ButtonComponent cssClass="e-outline" onClick={() => setEditing(null)}>
                Cancel
              </ButtonComponent>
              <ButtonComponent cssClass="e-primary" onClick={saveEdit}>
                Save
              </ButtonComponent>
            </div>
          </div>
        </DialogComponent>
      )}
    </div>
  );
};
