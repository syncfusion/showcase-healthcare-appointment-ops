import React, { useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAsyncResult } from '@hooks/useAsyncResult';
import {
  getPatient,
  getPatientAppointments,
  listAuditLog,
  listProviders,
  listDepartments,
  listLocations,
  createAppointment,
  checkInAppointment,
  noShowAppointment,
  cancelAppointment,
} from '@services/healthcare.service';
import { withDepartmentLabel } from '../utils/department';
import { fmtDate, fmtDateTime } from '../utils/dateFormat';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Toolbar,
} from '@syncfusion/ej2-react-grids';
import {
  TabComponent,
  TabItemDirective,
  TabItemsDirective,
} from '@syncfusion/ej2-react-navigations';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { DateTimePickerComponent } from '@syncfusion/ej2-react-calendars';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { ErrorBanner } from '@components/shared/ErrorBanner';
import { EmptyState } from '@components/shared/EmptyState';
import { LoadingState } from '@components/shared/LoadingState';
import { StatusBadge } from '@components/shared/StatusBadge';
import { KpiCard } from '@components/shared/KpiCard';
import { ClinicalHistoryTab } from '@components/patient/ClinicalHistoryTab';
import { MedicationsTab } from '@components/patient/MedicationsTab';
import { DocumentsTab } from '@components/patient/DocumentsTab';
import { CarePlanTab } from '@components/patient/CarePlanTab';
import { PatientTimeline } from '@components/patient/PatientTimeline';
import { CalendarDays, CheckCircle, Clock, UserX, MapPin, Stethoscope, Building2, Hourglass, FileText } from 'lucide-react';
import type {
  PatientDetailDto,
  AppointmentSummaryDto,
  AppointmentStatus,
  AuditLogEntryDto,
  ProviderSummaryDto,
  DepartmentDto,
  LocationDto,
} from '@models/dtos';

type TabKey = 'overview' | 'appointments' | 'clinical' | 'medications' | 'documents' | 'care-plan';
const TAB_KEYS: TabKey[] = ['overview', 'appointments', 'clinical', 'medications', 'documents', 'care-plan'];
const APPT_STATUSES: AppointmentStatus[] = [
  'Scheduled',
  'Confirmed',
  'CheckedIn',
  'InProgress',
  'Completed',
  'Cancelled',
  'NoShow',
];

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AppointmentSummaryDto | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ appt: AppointmentSummaryDto; kind: 'checkin' | 'noshow' } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const aiSidebarRef = useRef<import('@syncfusion/ej2-react-navigations').SidebarComponent>(null);

  const patientQuery = useAsyncResult(() => getPatient(id!), [id]);
  const appointmentsQuery = useAsyncResult(() => getPatientAppointments(id!), [id, refreshTick]);
  const auditQuery = useAsyncResult(() => listAuditLog('Patient', id!, 0, 50), [id, refreshTick]);

  const patient = patientQuery.data?.data;
  const appts = appointmentsQuery.data?.data ?? [];
  const auditEntries = auditQuery.data?.data?.items ?? [];

  const metrics = useMemo(() => {
    const now = Date.now();
    const completed = appts.filter((a) => a.status === 'Completed');
    const upcoming = appts.filter(
      (a) => (a.status === 'Scheduled' || a.status === 'Confirmed') && new Date(a.scheduledDateTime).getTime() >= now
    );
    const noShows = appts.filter((a) => a.status === 'NoShow');
    const lastVisit = completed.length
      ? completed.reduce((max, a) => (new Date(a.scheduledDateTime) > new Date(max.scheduledDateTime) ? a : max))
      : null;
    const nextVisit = upcoming.length
      ? upcoming.reduce((min, a) => (new Date(a.scheduledDateTime) < new Date(min.scheduledDateTime) ? a : min))
      : null;
    return { total: appts.length, completedCount: completed.length, noShowsCount: noShows.length, upcomingCount: upcoming.length, lastVisit, nextVisit };
  }, [appts]);

  const filteredAppts = useMemo(() => {
    if (statusFilter === 'All') return appts;
    return appts.filter((a) => a.status === statusFilter);
  }, [appts, statusFilter]);

  const age = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    const dob = new Date(patient.dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
    return a;
  }, [patient]);

  if (patientQuery.error) return <ErrorBanner message={patientQuery.error} onRetry={patientQuery.refresh} />;
  if (!patient && patientQuery.loading) return <LoadingState label="Loading patient…" />;
  if (!patient) return <EmptyState title="Patient not found" description="The requested patient does not exist." />;

  const refreshAll = () => setRefreshTick((t) => t + 1);

  const runAction = async () => {
    if (!confirmAction) return;
    const { appt, kind } = confirmAction;
    try {
      if (kind === 'checkin') await checkInAppointment(appt.appointmentId, 'kiosk');
      else await noShowAppointment(appt.appointmentId);
      refreshAll();
    } finally {
      setConfirmAction(null);
    }
  };

  const runCancel = async (reason: string) => {
    if (!cancelTarget) return;
    try {
      await cancelAppointment(cancelTarget.appointmentId, reason);
      refreshAll();
    } finally {
      setCancelTarget(null);
    }
  };

  const onTabSelecting = (e: { selectingIndex: number }) => {
    if (e.selectingIndex >= 0 && e.selectingIndex < TAB_KEYS.length) setActiveTab(TAB_KEYS[e.selectingIndex]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>    
      <div style={{ background: 'var(--color-sf-bg-primary)', borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-default)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-sf-bg-success-solid)', color: 'var(--color-sf-fg-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
          {patient.firstName[0]}{patient.lastName[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{patient.firstName} {patient.lastName}</div>
          <div style={{ fontSize: 14, color: 'var(--color-sf-fg-tertiary)' }}>
            MRN: {patient.medicalRecordNumber} • DOB: {fmtDate(patient.dateOfBirth)}{age !== null ? ` • Age: ${age}` : ''}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-sf-fg-quinary)', marginTop: 4 }}>
            {patient.phoneNumber} • {patient.email} • PCP:{' '}
            {patient.primaryCareProviderId ? (
              <Link to={`/providers/${patient.primaryCareProviderId}`}>{patient.primaryCareProviderName || 'View'}</Link>
            ) : (
              patient.primaryCareProviderName || '—'
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <StatusBadge status={patient.isActive ? 'Active' : 'Inactive'} />
          <div style={{ display: 'flex', gap: 8 }}>
            <ButtonComponent cssClass="e-outline" onClick={() => setBookDialogOpen(true)}>Book Appointment</ButtonComponent>
          </div>
        </div>
      </div>
    
      <TabComponent heightAdjustMode="Auto" selectedItem={TAB_KEYS.indexOf(activeTab)} selecting={onTabSelecting}>
        <TabItemsDirective>
          <TabItemDirective header={{ text: 'Overview' }} />
          <TabItemDirective header={{ text: 'Appointments' }} />
          <TabItemDirective header={{ text: 'Clinical History' }} />
          <TabItemDirective header={{ text: 'Medications' }} />
          <TabItemDirective header={{ text: 'Documents' }} />
          <TabItemDirective header={{ text: 'Care Plan' }} />
        </TabItemsDirective>
      </TabComponent>
     
      <div style={{ background: 'var(--color-sf-bg-primary)', borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-default)' }}>
        {activeTab === 'overview' && (
          <OverviewTab
            patient={patient}
            metrics={metrics}
            appts={appts}
            auditEntries={auditEntries}
          />
        )}

        {activeTab === 'clinical' && (
          <ClinicalHistoryTab patientId={patient.patientId} />
        )}

        {activeTab === 'medications' && (
          <MedicationsTab patientId={patient.patientId} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab patientId={patient.patientId} aiHooks={{ sidebarRef: aiSidebarRef, onTriggerAi: () => {} }} />
        )}

        {activeTab === 'care-plan' && (
          <CarePlanTab patientId={patient.patientId} />
        )}

        {activeTab === 'appointments' && (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <KpiCard title="Total" value={metrics.total} />
              <KpiCard title="Completed" value={metrics.completedCount} />
              <KpiCard title="No-Shows" value={metrics.noShowsCount} />
              <KpiCard title="Upcoming" value={metrics.upcomingCount} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--color-sf-fg-tertiary)' }}>Status:</span>
              <DropDownListComponent
                dataSource={['All', ...APPT_STATUSES]}
                value={statusFilter}
                change={(e: { value: string }) => setStatusFilter(e.value ?? 'All')}
                sortOrder="Ascending"
                width="200"
              />
            </div>
            {appointmentsQuery.loading ? (
              <LoadingState inline label="Loading appointments…" />
            ) : (
              <GridComponent
                dataSource={filteredAppts} 
                allowPaging
                pageSettings={{ pageSize: 10 }}
                allowSorting
                toolbar={['Search']}
              >
                <ColumnsDirective>
                  <ColumnDirective
                    headerText="Actions"
                    width="160"
                    template={(props: AppointmentSummaryDto) => (
                      <AppointmentActions
                        appt={props}
                        onCheckIn={(a) => setConfirmAction({ appt: a, kind: 'checkin' })}
                        onNoShow={(a) => setConfirmAction({ appt: a, kind: 'noshow' })}
                        onCancel={(a) => setCancelTarget(a)}
                      />
                    )}
                  />
                  <ColumnDirective
                    field="scheduledDateTime"
                    headerText="Date/Time"
                    width="160"
                    template={(props: AppointmentSummaryDto) => <>{fmtDateTime(props.scheduledDateTime)}</>}
                  />
                  <ColumnDirective
                    field="appointmentType"
                    headerText="Type"
                    width="140"
                    hideAtMedia="(max-width: 640px)"
                  />
                  <ColumnDirective
                    field="providerName"
                    headerText="Provider"
                    width="160"
                    hideAtMedia="(max-width: 1023px)"
                  />
                  <ColumnDirective
                    field="departmentName"
                    headerText="Department"
                    width="140"
                    hideAtMedia="(max-width: 1023px)"
                  />
                  <ColumnDirective
                    field="locationName"
                    headerText="Location"
                    width="140"
                    hideAtMedia="(max-width: 1023px)"
                  />
                  <ColumnDirective
                    field="roomNumber"
                    headerText="Room"
                    width="90"
                    hideAtMedia="(max-width: 1023px)"
                  />
                  <ColumnDirective
                    field="status"
                    headerText="Status"
                    width="120"
                    template={(props: AppointmentSummaryDto) => <StatusBadge status={props.status} />}
                  />
                  <ColumnDirective
                    field="durationMinutes"
                    headerText="Duration"
                    width="100"
                    hideAtMedia="(max-width: 640px)"
                  />
                  <ColumnDirective
                    field="reasonForVisit"
                    headerText="Reason"
                    width="200"
                    hideAtMedia="(max-width: 640px)"
                  />
                </ColumnsDirective>
                <Inject services={[Page, Sort, Toolbar]} />
              </GridComponent>
            )}
          </>
        )}
      </div>

      <BookAppointmentDialog
        open={bookDialogOpen}
        patientId={patient.patientId}
        onClose={() => setBookDialogOpen(false)}
        onCreated={() => {
          setBookDialogOpen(false);
          refreshAll();
          setActiveTab('appointments');
        }}
      />
    
      <DialogComponent
        visible={cancelTarget !== null}
        header="Cancel Appointment"
        showCloseIcon
        width="400px"
        close={() => setCancelTarget(null)}
        buttons={[
          { click: () => { const r = (document.getElementById('cancel-reason-input') as HTMLInputElement)?.value ?? ''; runCancel(r); }, buttonModel: { content: 'Confirm Cancel', cssClass: 'e-danger' } },
          { click: () => setCancelTarget(null), buttonModel: { content: 'Dismiss', cssClass: 'e-flat' } },
        ]}
      >
        <div style={{ padding: 8 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-sf-fg-tertiary)' }}>
            Cancel appointment on {cancelTarget ? fmtDateTime(cancelTarget.scheduledDateTime) : ''}?
          </p>
          <TextBoxComponent id="cancel-reason-input" placeholder="Reason (optional)" multiline={true} />
        </div>
      </DialogComponent>
    
      <DialogComponent
        visible={confirmAction !== null}
        header={confirmAction?.kind === 'checkin' ? 'Check In' : 'Mark No-Show'}
        showCloseIcon
        width="360px"
        close={() => setConfirmAction(null)}
        buttons={[
          { click: runAction, buttonModel: { content: confirmAction?.kind === 'checkin' ? 'Check In' : 'Mark No-Show', isPrimary: true } },
          { click: () => setConfirmAction(null), buttonModel: { content: 'Dismiss', cssClass: 'e-flat' } },
        ]}
      >
        <div style={{ padding: 8, fontSize: 14 }}>
          {confirmAction?.kind === 'checkin'
            ? 'Check in this patient for the selected appointment?'
            : 'Mark this appointment as a no-show?'}
        </div>
      </DialogComponent>
    </div>
  );
};

const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: 'var(--color-sf-fg-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 14, color: 'var(--color-sf-fg-primary)', fontWeight: 500 }}>{value || '—'}</div>
  </div>
);

interface MetricsBundle {
  total: number;
  completedCount: number;
  noShowsCount: number;
  upcomingCount: number;
  lastVisit: AppointmentSummaryDto | null;
  nextVisit: AppointmentSummaryDto | null;
}

const panelStyle: React.CSSProperties = {
  background: 'var(--color-sf-bg-secondary)',
  borderRadius: 8,
  padding: 16,
  border: '1px solid var(--color-sf-border-secondary)',
};
const panelTitleStyle: React.CSSProperties = { fontWeight: 600, fontSize: 15, marginBottom: 12 };

const OverviewTab: React.FC<{
  patient: PatientDetailDto;
  metrics: MetricsBundle;
  appts: AppointmentSummaryDto[];
  auditEntries: AuditLogEntryDto[];
}> = ({ patient, metrics, appts, auditEntries }) => {
  const next = metrics.nextVisit;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard title="Total Appointments" value={metrics.total} icon={<CalendarDays size={18} />} />
        <KpiCard title="Completed" value={metrics.completedCount} icon={<CheckCircle size={18} />} />
        <KpiCard title="Upcoming" value={metrics.upcomingCount} icon={<Clock size={18} />} />
        <KpiCard title="No-Shows" value={metrics.noShowsCount} icon={<UserX size={18} />} />
      </div>

      <div className="responsive-collapse-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'stretch' }}>
        <div style={panelStyle}>
          <div style={panelTitleStyle}>Patient Timeline</div>
          <PatientTimeline appts={appts} auditEntries={auditEntries} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={panelStyle}>
          <div style={panelTitleStyle}>Upcoming Appointment</div>
          {next ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-sf-fg-brand-primary)', lineHeight: 1.3 }}>
                  {fmtDateTime(next.scheduledDateTime)}
                </div>
                <StatusBadge status={next.status} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-sf-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-sf-fg-brand-primary)', flexShrink: 0 }}>
                  <Stethoscope size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{next.appointmentType}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-sf-fg-tertiary)' }}>{next.providerName}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-sf-fg-secondary)' }}>
                  <Building2 size={14} style={{ color: 'var(--color-sf-fg-quaternary)' }} />
                  <span>{next.departmentName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-sf-fg-secondary)' }}>
                  <MapPin size={14} style={{ color: 'var(--color-sf-fg-quaternary)' }} />
                  <span>{next.locationName}{next.roomNumber ? ` · Room ${next.roomNumber}` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-sf-fg-secondary)' }}>
                  <Hourglass size={14} style={{ color: 'var(--color-sf-fg-quaternary)' }} />
                  <span>{next.durationMinutes} min</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-sf-fg-secondary)' }}>No upcoming appointments</div>
              <div style={{ fontSize: 13, color: 'var(--color-sf-fg-tertiary)', marginTop: 4 }}>A future appointment will appear here once scheduled.</div>
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelTitleStyle}>Patient Information</div>
          <div className="form-section-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InfoField label="Gender" value={patient.gender} />
            <InfoField label="Preferred Language" value={patient.preferredLanguage} />
            <InfoField label="Insurance" value={patient.insuranceType} />
            <InfoField label="Registration Date" value={fmtDate(patient.registrationDate)} />
            <InfoField label="Proxy Access" value={patient.hasProxyAccess ? 'Yes' : 'No'} />
            <InfoField label="Address" value={`${patient.addressLine}, ${patient.city}, ${patient.state} ${patient.postalCode}`} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentActions: React.FC<{
  appt: AppointmentSummaryDto;
  onCheckIn: (a: AppointmentSummaryDto) => void;
  onNoShow: (a: AppointmentSummaryDto) => void;
  onCancel: (a: AppointmentSummaryDto) => void;
}> = ({ appt, onCheckIn, onNoShow, onCancel }) => {
  const actionable = appt.status === 'Scheduled' || appt.status === 'Confirmed' || appt.status === 'CheckedIn';
  if (!actionable) return <span style={{ color: 'var(--color-sf-fg-quinary)', fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {(appt.status === 'Scheduled' || appt.status === 'Confirmed') && (
        <ButtonComponent cssClass="e-primary e-small" onClick={() => onCheckIn(appt)}>Check In</ButtonComponent>
      )}
      {(appt.status === 'Scheduled' || appt.status === 'Confirmed') && (
        <ButtonComponent cssClass="e-info e-small e-outline" onClick={() => onNoShow(appt)}>No-Show</ButtonComponent>
      )}
      <ButtonComponent cssClass="e-danger e-small e-outline" onClick={() => onCancel(appt)}>Cancel</ButtonComponent>
    </div>
  );
};

const BookAppointmentDialog: React.FC<{
  open: boolean;
  patientId: string;
  onClose: () => void;
  onCreated: () => void;
}> = ({ open, patientId, onClose, onCreated }) => {
  const providersQ = useAsyncResult(() => listProviders(), [open]);
  const deptsQ = useAsyncResult(() => listDepartments(), [open]);
  const locsQ = useAsyncResult(() => listLocations(), [open]);
  const [providerId, setProviderId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [apptType, setApptType] = useState('Consultation');
  const [scheduled, setScheduled] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers: ProviderSummaryDto[] = providersQ.data?.data?.items ?? [];
  const departments: DepartmentDto[] = deptsQ.data?.data ?? [];
  const locations: LocationDto[] = locsQ.data?.data ?? [];

  const submit = async () => {
    if (submitting) return;
    if (!providerId || !departmentId || !locationId) {
      setError('Please select provider, department, and location.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createAppointment({
        patientId,
        providerId,
        departmentId,
        locationId,
        appointmentType: apptType,
        scheduledDateTime: scheduled.toISOString(),
        durationMinutes: duration,
        reasonForVisit: reason,
      });
      if (res.status === 'ok') onCreated();
      else setError(res.error?.detail ?? 'Failed to create appointment.');
    } catch {
      setError('Failed to create appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogComponent
      visible={open}
      header="Book Appointment"
      showCloseIcon
      width="520px"
      close={onClose}
      buttons={[
        { click: submit, buttonModel: { content: submitting ? 'Saving…' : 'Book', isPrimary: true, disabled: submitting } },
        { click: onClose, buttonModel: { content: 'Cancel', cssClass: 'e-flat' } },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8 }}>
        <div>
          <label style={labelStyle}>Provider</label>
          <DropDownListComponent
            dataSource={providers.map((p) => ({ text: `${p.firstName} ${p.lastName} (${p.specialty})`, value: p.providerId }))}
            fields={{ text: 'text', value: 'value' }}
            value={providerId}
            change={(e: { value: string }) => setProviderId(e.value ?? '')}
            placeholder="Select provider"
            sortOrder="Ascending"
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Department</label>
            <DropDownListComponent
              dataSource={withDepartmentLabel(departments) as unknown as { [key: string]: object }[]}
              fields={{ text: 'displayLabel', value: 'departmentId' }}
              value={departmentId}
              change={(e: { value: string }) => setDepartmentId(e.value ?? '')}
              placeholder="Select"
              sortOrder="Ascending"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Location</label>
            <DropDownListComponent
              dataSource={locations as unknown as { [key: string]: object }[]}
              fields={{ text: 'locationName', value: 'locationId' }}
              value={locationId}
              change={(e: { value: string }) => setLocationId(e.value ?? '')}
              placeholder="Select"
              sortOrder="Ascending"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Type</label>
            <DropDownListComponent
              dataSource={['Consultation', 'Follow-up', 'Telehealth', 'Procedure', 'Lab Visit', 'Vaccination']}
              value={apptType}
              change={(e: { value: string }) => setApptType(e.value ?? 'Consultation')}
              sortOrder="Ascending"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Duration (min)</label>
            <DropDownListComponent dataSource={[15, 30, 45, 60]} value={duration} change={(e: { value: number }) => setDuration(e.value ?? 30)} sortOrder="Ascending" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Date / Time</label>
          <DateTimePickerComponent value={scheduled} format="MM/dd/yyyy h:mm a" change={(e: { value: Date | null }) => setScheduled(e.value ?? new Date())} />
        </div>
        <div>
          <label style={labelStyle}>Reason for Visit</label>
          <TextBoxComponent value={reason} multiline={true} change={(e: { value: string }) => setReason(e.value ?? '')} />
        </div>
        {error && <div style={{ color: 'var(--color-sf-fg-error-primary)', fontSize: 13 }}>{error}</div>}
      </div>
    </DialogComponent>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-sf-fg-tertiary)', marginBottom: 4 };
