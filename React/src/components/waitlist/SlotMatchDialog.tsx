import React, { useEffect, useState } from 'react';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';
import {
  listProviders,
  getProviderAvailability,
  createAppointment,
  matchWaitlistEntry,
} from '@services/healthcare.service';
import type { WaitlistEntryDto, SlotDto, ProviderSummaryDto } from '@models/dtos';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { LoadingState } from '@components/shared/LoadingState';
import { fmtDate } from '../../utils/dateFormat';

export interface SlotMatchDialogProps {
  entry: WaitlistEntryDto;
  onClose: () => void;
  onMatched: () => void;
}

function toDateOnly(value: string): Date {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function toLocalDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type ProviderOption = ProviderSummaryDto & { displayName: string };

export const SlotMatchDialog: React.FC<SlotMatchDialogProps> = ({ entry, onClose, onMatched }) => {
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providerId, setProviderId] = useState<string>(entry.preferredProviderId ?? '');
  const [date, setDate] = useState<Date>(toDateOnly(entry.preferredDateRangeStart));
  const [slots, setSlots] = useState<SlotDto[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotDto | null>(null);
  const [finding, setFinding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    let active = true;
    listProviders(entry.preferredDepartmentId)
      .then((res) => {
        if (!active || res.status !== 'ok') return;
        const list: ProviderOption[] = (res.data?.items ?? [])
          .map((p) => ({ ...p, displayName: `${p.title} ${p.firstName} ${p.lastName}`.trim() }))
          .sort((a, b) => a.lastName.localeCompare(b.lastName));
        setProviders(list);
        if (!entry.preferredProviderId && list.length > 0) {
          setProviderId((prev) => prev || list[0].providerId);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [entry.preferredDepartmentId, entry.preferredProviderId]);

  const findSlots = async () => {
    if (!providerId) {
      setError('Select a provider first.');
      return;
    }
    setFinding(true);
    setError(null);
    setSelectedSlot(null);
    try {
      const iso = toLocalDateOnly(date);
      const res = await getProviderAvailability(providerId, iso);
      if (res.status === 'ok') {
        setSlots((res.data ?? []).filter((s) => s.isAvailable));
      } else {
        setError(res.error?.title ?? 'Could not load availability.');
        setSlots([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load availability.');
      setSlots([]);
    } finally {
      setFinding(false);
    }
  };

  const confirmMatch = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const durationMinutes = Math.max(
        15,
        Math.round((new Date(selectedSlot.slotEnd).getTime() - new Date(selectedSlot.slotStart).getTime()) / 60000)
      );
      const created = await createAppointment({
        patientId: entry.patientId,
        providerId: selectedSlot.providerId,
        departmentId: entry.preferredDepartmentId,
        locationId: selectedSlot.locationId,
        appointmentType: entry.requestedAppointmentType,
        scheduledDateTime: selectedSlot.slotStart,
        durationMinutes,
        reasonForVisit: `Waitlist match — ${entry.requestedAppointmentType}`,
      });
      if (created.status !== 'ok' || !created.data) {
        setError(created.error?.title ?? 'Failed to create the appointment.');
        return;
      }
      const matched = await matchWaitlistEntry(entry.waitlistId, created.data.appointmentId);
      if (matched.status !== 'ok') {
        setError(matched.error?.title ?? 'Appointment created but matching failed.');
        return;
      }
      onMatched();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to match the waitlist entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogComponent
      header={`Match slot — ${entry.patientName}`}
      visible
      width="480px"
      isModal
      showCloseIcon
      close={onClose}
      target="#root"
    >
      <div style={{ padding: '4px 2px' }}>
        <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)', marginBottom: 14 }}>
          {entry.requestedAppointmentType} • {entry.preferredDepartmentName} • preferred{' '}
          {fmtDate(entry.preferredDateRangeStart)} – {fmtDate(entry.preferredDateRangeEnd)}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-sf-fg-secondary)' }}>Provider</label>
            <DropDownListComponent
              dataSource={providers as any}
              fields={{ text: 'displayName', value: 'providerId' }}
              value={providerId}
              placeholder="Select provider"
              sortOrder="Ascending"
              change={(e: any) => setProviderId((e.value as string) ?? '')}
              itemTemplate={(p: ProviderOption) => (
                <span>
                  {p.displayName} — {p.specialty}
                </span>
              )}
            />
          </div>
          <div style={{ width: 150, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-sf-fg-secondary)' }}>Date</label>
            <DatePickerComponent
              value={date}
              format="MM/dd/yyyy"
              min={toDateOnly(entry.preferredDateRangeStart)}
              max={toDateOnly(entry.preferredDateRangeEnd)}
              change={(e: any) => e.value && setDate(e.value as Date)}
            />
          </div>
          <ButtonComponent cssClass="e-primary" onClick={findSlots} disabled={finding}>
            {finding ? 'Finding…' : 'Find slots'}
          </ButtonComponent>
        </div>

        {error && (
          <div style={{ marginBottom: 12 }}>
            <ErrorBanner message={error} />
          </div>
        )}

        <div style={{ maxHeight: 220, overflow: 'auto' }}>
          {finding ? (
            <LoadingState inline label="Loading available slots…" />
          ) : slots.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-sf-fg-quinary)', padding: 24, fontSize: 13 }}>
              No available slots for this provider and date. Try another date.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {slots.map((s) => {
                const selected = selectedSlot?.slotStart === s.slotStart;
                return (
                  <button
                    key={s.slotStart}
                    onClick={() => setSelectedSlot(s)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 6,
                      border: selected ? '2px solid var(--color-sf-border-brand-solid)' : '1px solid var(--color-sf-border-secondary)',
                      background: selected ? 'var(--color-sf-bg-brand-primary)' : 'var(--color-sf-bg-primary)',
                      color: selected ? 'var(--color-sf-fg-brand-primary)' : 'var(--color-sf-fg-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {formatTime(s.slotStart)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <ButtonComponent cssClass="e-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </ButtonComponent>
          <ButtonComponent cssClass="e-success" onClick={confirmMatch} disabled={!selectedSlot || submitting}>
            {submitting ? 'Matching…' : selectedSlot ? `Confirm ${formatTime(selectedSlot.slotStart)}` : 'Confirm match'}
          </ButtonComponent>
        </div>
      </div>
    </DialogComponent>
  );
};
