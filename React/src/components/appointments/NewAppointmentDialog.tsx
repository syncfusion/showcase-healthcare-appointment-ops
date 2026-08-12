import React, { useEffect, useMemo, useState } from 'react';
import {
  DialogComponent,
  ButtonPropsModel,
} from '@syncfusion/ej2-react-popups';
import {
  AutoCompleteComponent,
  DropDownListComponent,
  ChangeEventArgs as DropDownChangeArgs,
} from '@syncfusion/ej2-react-dropdowns';
import {
  DateTimePickerComponent,
  ChangeEventArgs as DateChangeArgs,
} from '@syncfusion/ej2-react-calendars';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import type {
  PatientSummaryDto,
  ProviderSummaryDto,
  DepartmentDto,
  LocationDto,
  CreateAppointmentRequest,
} from '@models/dtos';
import { listPatients, listLocations, getAppointmentConflicts } from '@services/healthcare.service';
import { withDepartmentLabel } from '../../utils/department';
import { FormFieldError } from '@components/shared/FormFieldError';

export interface NewAppointmentDialogProps {
  visible: boolean;
  initialDateTime?: Date;
  initialProviderId?: string;
  providers: ProviderSummaryDto[];
  departments: DepartmentDto[];
  onClose: () => void;
  onSubmit: (req: CreateAppointmentRequest) => void;
  loading?: boolean;
}

type FieldName =
  | 'patient'
  | 'provider'
  | 'department'
  | 'location'
  | 'scheduledDateTime'
  | 'appointmentType'
  | 'reasonForVisit';

export const NewAppointmentDialog: React.FC<NewAppointmentDialogProps> = ({
  visible,
  initialDateTime,
  initialProviderId,
  providers,
  departments,
  onClose,
  onSubmit,
  loading,
}) => {
  const [patientId, setPatientId] = useState<string>('');
  const [patientData, setPatientData] = useState<(PatientSummaryDto & { display: string })[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [providerId, setProviderId] = useState<string>(initialProviderId ?? '');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [appointmentType, setAppointmentType] = useState<string>('');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(initialDateTime ?? null);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [conflictError, setConflictError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const filteredProviders = useMemo(() => {
    if (!departmentId) return providers;
    return providers.filter((p) => p.departmentId === departmentId);
  }, [providers, departmentId]);

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.departmentId === departmentId),
    [departments, departmentId]
  );

  useEffect(() => {
    listLocations().then((res) => setLocations(res.data ?? []));
  }, []);

  useEffect(() => {
    if (selectedDepartment) setLocationId(selectedDepartment.locationId);
  }, [selectedDepartment]);

  useEffect(() => {
    if (visible) {
      setPatientId('');
      setPatientData([]);
      setProviderId(initialProviderId ?? '');
      setDepartmentId('');
      setLocationId('');
      setAppointmentType('');
      setScheduledDateTime(initialDateTime ?? null);
      setDurationMinutes(15);
      setReasonForVisit('');
      setNotes('');
      setErrors({});
      setConflictError('');
    }
  }, [visible, initialDateTime, initialProviderId]);

  const patientItemTemplate = (data: PatientSummaryDto) =>
    `${data.lastName}, ${data.firstName} — MRN ${data.medicalRecordNumber}`;

  const validateField = (name: FieldName, value: unknown): string => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      const label = name === 'scheduledDateTime' ? 'Date & time' : name[0].toUpperCase() + name.slice(1);
      return `${label} is required`;
    }
    return '';
  };

  const handleBlur = (name: FieldName, value: unknown) => {
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const runValidation = (): boolean => {
    const next: Partial<Record<FieldName, string>> = {
      patient: validateField('patient', patientId),
      provider: validateField('provider', providerId),
      department: validateField('department', departmentId),
      location: validateField('location', locationId),
      scheduledDateTime: validateField('scheduledDateTime', scheduledDateTime),
      appointmentType: validateField('appointmentType', appointmentType),
      reasonForVisit: validateField('reasonForVisit', reasonForVisit),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const canSubmit =
    patientId && providerId && departmentId && locationId && appointmentType && scheduledDateTime && reasonForVisit;

  const handleSubmit = async () => {
    if (submitting) return;
    if (!runValidation() || !canSubmit || !scheduledDateTime) return;
    setConflictError('');
    setSubmitting(true);
    try {
      const conflicts = await getAppointmentConflicts(
        providerId,
        scheduledDateTime.toISOString(),
        durationMinutes
      );
      if (conflicts.data && conflicts.data.length > 0) {
        setConflictError('Provider has an overlapping appointment at this time.');
        setSubmitting(false);
        return;
      }
      onSubmit({
        patientId,
        providerId,
        departmentId,
        locationId,
        appointmentType,
        scheduledDateTime: scheduledDateTime.toISOString(),
        durationMinutes,
        reasonForVisit,
        notes,
      });
    } catch {
      setConflictError('Could not verify conflicts. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const dialogButtons: ButtonPropsModel[] = [
    {
      click: handleSubmit,
      buttonModel: {
        content: 'Book Appointment',
        cssClass: 'e-primary',
        isPrimary: true,
        disabled: !canSubmit || loading || submitting,
      },
    },
    { click: onClose, buttonModel: { content: 'Cancel', cssClass: 'e-outline' } },
  ];

  const patientFields = { value: 'patientId', text: 'display' };

  const providerData = useMemo(
    () =>
      filteredProviders.map((p) => ({
        ...p,
        displayName: `Dr. ${p.lastName} — ${p.specialty}`,
      })),
    [filteredProviders]
  );

  const durationOptions = [
    { text: '15 min', value: 15 },
    { text: '30 min', value: 30 },
    { text: '45 min', value: 45 },
    { text: '60 min', value: 60 },
  ];

  const appointmentTypeOptions = [
    'New Patient',
    'Follow-Up',
    'Annual Physical',
    'Urgent Visit',
    'Consultation',
    'Procedure',
  ];

  return (
    <DialogComponent
      visible={visible}
      header="New Appointment"
      showCloseIcon
      close={onClose}
      width="640px"
      isModal
      buttons={dialogButtons}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}
      >
        <div>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Patient *</label>
          <AutoCompleteComponent
            cssClass={errors.patient ? 'e-error' : ''}
            dataSource={patientData as any}
            fields={patientFields}
            itemTemplate={patientItemTemplate as any}
            placeholder="Search by name or MRN"
            minLength={2}
            suggestionCount={10}
            noRecordsTemplate={patientLoading ? 'Searching…' : 'No patients found'}
            filterType="Contains"
            ignoreCase={true}
            sortOrder="Ascending"
            filtering={(args: any) => {
              if (!args.text || args.text.length < 2) {
                args.updateData([] as any);
                return;
              }
              setPatientLoading(true);
              listPatients(args.text)
                .then((res) => {
                  const items = (res.data?.items ?? []).map((p: PatientSummaryDto) => ({
                    ...p,
                    display: `${p.lastName}, ${p.firstName} — MRN ${p.medicalRecordNumber}`,
                  }));
                  setPatientData(items);
                  args.updateData(items);
                })
                .catch(() => {
                  args.updateData([] as any);
                })
                .finally(() => setPatientLoading(false));
            }}
            change={(e: { value?: string; itemData?: any }) => {
              const fromItem = e.itemData?.patientId as string | undefined;
              const fromValue = typeof e.value === 'string' ? e.value : '';
              const id = fromItem || fromValue || '';
              setPatientId(id);
              handleBlur('patient', id);
            }}
            value={patientId || undefined}
          />
          {errors.patient && <FormFieldError message={errors.patient} />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Department *</label>
            <DropDownListComponent
              cssClass={errors.department ? 'e-error' : ''}
              dataSource={withDepartmentLabel(departments) as any}
              fields={{ text: 'displayLabel', value: 'departmentId' }}
              placeholder="Select department"
              sortOrder="Ascending"
              change={(e: DropDownChangeArgs) => {
                setDepartmentId((e.value as string) ?? '');
                handleBlur('department', e.value ?? '');
              }}
              value={departmentId}
            />
            {errors.department && <FormFieldError message={errors.department} />}
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Location *</label>
            <DropDownListComponent
              cssClass={errors.location ? 'e-error' : ''}
              dataSource={locations as any}
              fields={{ text: 'locationName', value: 'locationId' }}
              placeholder="Select location"
              sortOrder="Ascending"
              change={(e: DropDownChangeArgs) => {
                setLocationId((e.value as string) ?? '');
                handleBlur('location', e.value ?? '');
              }}
              value={locationId}
              enabled={!!departmentId}
            />
            {errors.location && <FormFieldError message={errors.location} />}
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Provider *</label>
          <AutoCompleteComponent
            cssClass={errors.provider ? 'e-error' : ''}
            dataSource={providerData}
            fields={{ value: 'providerId', text: 'displayName' }}
            placeholder={departmentId ? 'Select provider' : 'Select a department first'}
            sortOrder="Ascending"
            change={(e: DropDownChangeArgs) => {
              setProviderId((e.value as string) ?? '');
              handleBlur('provider', e.value ?? '');
            }}
            value={providerId}
            enabled={!!departmentId}
          />
          {errors.provider && <FormFieldError message={errors.provider} />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Date & Time *</label>
            <DateTimePickerComponent
              cssClass={errors.scheduledDateTime || conflictError ? 'e-error' : ''}
              value={scheduledDateTime ?? undefined}
              change={(e: DateChangeArgs) => {
                setScheduledDateTime((e.value as Date) ?? null);
                handleBlur('scheduledDateTime', e.value ?? null);
                setConflictError('');
              }}
              style={{ width: '100%' }}
            />
            {errors.scheduledDateTime && <FormFieldError message={errors.scheduledDateTime} />}
            {conflictError && <FormFieldError message={conflictError} />}
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Duration (min) *</label>
            <DropDownListComponent
              dataSource={durationOptions as any}
              fields={{ text: 'text', value: 'value' }}
              placeholder="Duration"
              sortOrder="Ascending"
              change={(e: DropDownChangeArgs) => setDurationMinutes(Number(e.value) || 15)}
              value={durationMinutes}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Type *</label>
            <DropDownListComponent
              cssClass={errors.appointmentType ? 'e-error' : ''}
              dataSource={appointmentTypeOptions}
              placeholder="Appointment type"
              sortOrder="Ascending"
              change={(e: DropDownChangeArgs) => {
                setAppointmentType((e.value as string) ?? '');
                handleBlur('appointmentType', e.value ?? '');
              }}
              value={appointmentType}
            />
            {errors.appointmentType && <FormFieldError message={errors.appointmentType} />}
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Reason for Visit *</label>
          <TextBoxComponent
            cssClass={errors.reasonForVisit ? 'e-error' : ''}
            placeholder="Enter reason for visit"
            value={reasonForVisit}
            change={(e: { value?: string }) => setReasonForVisit(e.value ?? '')}
            blur={() => handleBlur('reasonForVisit', reasonForVisit)}
            multiline
            style={{ width: '100%' }}
          />
          {errors.reasonForVisit && <FormFieldError message={errors.reasonForVisit} />}
        </div>

        <div>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Notes</label>
          <TextBoxComponent
            placeholder="Additional notes"
            value={notes}
            change={(e: { value?: string }) => setNotes(e.value ?? '')}
            multiline
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </DialogComponent>
  );
};
