import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  DialogModule,
  ButtonPropsModel,
} from '@syncfusion/ej2-angular-popups';
import {
  AutoCompleteModule,
  DropDownListModule,
  FilteringEventArgs,
  ChangeEventArgs as DropDownChangeArgs,
  SelectEventArgs,
} from '@syncfusion/ej2-angular-dropdowns';
import {
  DateTimePickerModule,
  ChangeEventArgs as DateChangeArgs,
} from '@syncfusion/ej2-angular-calendars';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { FormFieldErrorComponent } from '../../shared/form-field-error/form-field-error.component';
import type {
  PatientSummaryDto,
  ProviderSummaryDto,
  DepartmentDto,
  LocationDto,
  CreateAppointmentRequest,
} from '../../core/models/dtos';

type FieldName =
  | 'patient'
  | 'provider'
  | 'department'
  | 'location'
  | 'scheduledDateTime'
  | 'appointmentType'
  | 'reasonForVisit';

interface PatientOption extends PatientSummaryDto {
  display: string;
}

interface ProviderOption extends ProviderSummaryDto {
  displayName: string;
}

@Component({
  selector: 'app-new-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    AutoCompleteModule,
    DropDownListModule,
    DateTimePickerModule,
    TextBoxModule,
    ButtonModule,
    FormFieldErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-appointment-dialog.component.html',
  styleUrl: './new-appointment-dialog.component.scss',
})
export class NewAppointmentDialogComponent implements OnInit {
  private healthcare = inject(HealthcareService);

  @Input() visible = false;
  @Input() initialDateTime?: Date | null;
  @Input() initialProviderId?: string | null;
  @Input({ required: true }) providers: ProviderSummaryDto[] = [];
  @Input({ required: true }) departments: DepartmentDto[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<CreateAppointmentRequest>();

  readonly patientId = signal('');
  readonly patients = signal<PatientOption[]>([]);
  readonly providerId = signal('');
  readonly departmentId = signal('');
  readonly locationId = signal('');
  readonly locations = signal<LocationDto[]>([]);
  readonly appointmentType = signal('');
  readonly scheduledDateTime = signal<Date | null>(null);
  readonly durationMinutes = signal(15);
  readonly reasonForVisit = signal('');
  readonly notes = signal('');
  readonly errors = signal<Partial<Record<FieldName, string>>>({});
  readonly conflictError = signal('');
  readonly submitting = signal(false);

  readonly patientFields = { value: 'patientId', text: 'display' };
  readonly providerFields = { value: 'providerId', text: 'displayName' };
  readonly locationFields = { text: 'locationName', value: 'locationId' };
  readonly departmentFields = { text: 'displayLabel', value: 'departmentId' };
  readonly durationFields = { text: 'text', value: 'value' };
  readonly durationOptions = [
    { text: '15 min', value: 15 },
    { text: '30 min', value: 30 },
    { text: '45 min', value: 45 },
    { text: '60 min', value: 60 },
  ];
  readonly appointmentTypeOptions = [
    'New Patient',
    'Follow-Up',
    'Annual Physical',
    'Urgent Visit',
    'Consultation',
    'Procedure',
  ];

  readonly departmentOptions = computed(() =>
    this.departments.map((d) => ({ ...d, displayLabel: `${d.departmentName} — ${d.locationName}` }))
  );

  readonly filteredProviders = computed<ProviderOption[]>(() => {
    const dept = this.departmentId();
    const list = dept ? this.providers.filter((p) => p.departmentId === dept) : this.providers;
    return list.map((p) => ({ ...p, displayName: `Dr. ${p.lastName} — ${p.specialty}` }));
  });

  readonly selectedDepartment = computed(() =>
    this.departments.find((d) => d.departmentId === this.departmentId())
  );

  readonly canSubmit = computed(() =>
    !!(
      this.patientId() &&
      this.providerId() &&
      this.departmentId() &&
      this.locationId() &&
      this.appointmentType() &&
      this.scheduledDateTime() &&
      this.reasonForVisit()
    )
  );

  readonly dialogButtons = computed<ButtonPropsModel[]>(() => [
    {
      click: () => this.handleSubmit(),
      buttonModel: {
        content: 'Book Appointment',
        cssClass: 'e-primary',
        isPrimary: true,
        disabled: !this.canSubmit() || this.submitting(),
      },
    },
    {
      click: () => this.onClose.emit(),
      buttonModel: { content: 'Cancel', cssClass: 'e-outline' },
    },
  ]);

  ngOnInit(): void {
    this.healthcare
      .listLocations()
      .pipe(map((res) => (res.status === 'ok' ? res.data ?? [] : [])))
      .subscribe((locs) => this.locations.set(locs));

    if (this.initialProviderId) this.providerId.set(this.initialProviderId);
    if (this.initialDateTime) this.scheduledDateTime.set(this.initialDateTime);
  }

  onPatientFiltering(e: FilteringEventArgs): void {
    if (!e.text || e.text.length < 2) {
      e.updateData([]);
      return;
    }
    e.preventDefaultAction = true;
    this.healthcare
      .listPatients(e.text, 0, 20)
      .pipe(
        map((res) => (res.status === 'ok' ? res.data?.items ?? [] : [])),
        catchError(() => of([]))
      )
      .subscribe((items) => {
        const options = items.map((p) => ({ ...p, display: `${p.lastName}, ${p.firstName} — MRN ${p.medicalRecordNumber}` }));
        e.updateData(options as unknown as { [key: string]: Object }[]);
      });
  }

  onPatientSelect(e: SelectEventArgs): void {
    const item = e.itemData as unknown as PatientOption | null;
    const id = item?.patientId ?? '';
    this.patientId.set(id);
    this.validateField('patient', id);
  }

  onProviderFiltering(e: FilteringEventArgs): void {
    e.preventDefaultAction = true;
    const text = (e.text || '').toLowerCase();
    const options = this.filteredProviders().filter((p) => p.displayName.toLowerCase().includes(text));
    e.updateData(options as unknown as { [key: string]: Object }[]);
  }

  onDepartmentChange(args: DropDownChangeArgs): void {
    const value = (args.value as string) ?? '';
    this.departmentId.set(value);
    const dept = this.departments.find((d) => d.departmentId === value);
    this.locationId.set(dept?.locationId ?? '');
    this.providerId.set('');
    this.validateField('department', value);
  }

  onLocationChange(args: DropDownChangeArgs): void {
    const value = (args.value as string) ?? '';
    this.locationId.set(value);
    this.validateField('location', value);
  }

  onProviderSelect(args: DropDownChangeArgs): void {
    const item = args.itemData as unknown as ProviderOption | null;
    const value = item?.providerId ?? '';
    this.providerId.set(value);
    this.validateField('provider', value);
  }

  onDateTimeChange(args: DateChangeArgs): void {
    this.scheduledDateTime.set((args.value as Date) ?? null);
    this.validateField('scheduledDateTime', args.value);
    this.conflictError.set('');
  }

  onDurationChange(args: DropDownChangeArgs): void {
    this.durationMinutes.set(Number(args.value) || 15);
  }

  onTypeChange(args: DropDownChangeArgs): void {
    const value = (args.value as string) ?? '';
    this.appointmentType.set(value);
    this.validateField('appointmentType', value);
  }

  onReasonChange(value: string | undefined): void {
    this.reasonForVisit.set(value ?? '');
  }

  onReasonBlur(): void {
    this.validateField('reasonForVisit', this.reasonForVisit());
  }

  onNotesChange(value: string | undefined): void {
    this.notes.set(value ?? '');
  }

  private validateField(name: FieldName, value: unknown): void {
    const err = this.validateValue(name, value);
    this.errors.update((prev) => ({ ...prev, [name]: err }));
  }

  private validateValue(name: FieldName, value: unknown): string {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      const label = name === 'scheduledDateTime' ? 'Date & time' : name[0].toUpperCase() + name.slice(1);
      return `${label} is required`;
    }
    return '';
  }

  private runValidation(): boolean {
    const next: Partial<Record<FieldName, string>> = {
      patient: this.validateValue('patient', this.patientId()),
      provider: this.validateValue('provider', this.providerId()),
      department: this.validateValue('department', this.departmentId()),
      location: this.validateValue('location', this.locationId()),
      scheduledDateTime: this.validateValue('scheduledDateTime', this.scheduledDateTime()),
      appointmentType: this.validateValue('appointmentType', this.appointmentType()),
      reasonForVisit: this.validateValue('reasonForVisit', this.reasonForVisit()),
    };
    this.errors.set(next);
    return !Object.values(next).some(Boolean);
  }

  handleSubmit(): void {
    if (this.submitting()) return;
    if (!this.runValidation() || !this.canSubmit() || !this.scheduledDateTime()) return;
    this.conflictError.set('');
    this.submitting.set(true);
    this.healthcare
      .getAppointmentConflicts(this.providerId(), this.scheduledDateTime()!.toISOString(), this.durationMinutes())
      .pipe(
        map((res) => (res.status === 'ok' ? res.data ?? [] : [])),
        catchError(() => of([]))
      )
      .subscribe((conflicts) => {
        if (conflicts && conflicts.length > 0) {
          this.conflictError.set('Provider has an overlapping appointment at this time.');
          this.submitting.set(false);
          return;
        }
        this.submitting.set(false);
        this.onSubmit.emit({
          patientId: this.patientId(),
          providerId: this.providerId(),
          departmentId: this.departmentId(),
          locationId: this.locationId(),
          appointmentType: this.appointmentType(),
          scheduledDateTime: this.scheduledDateTime()!.toISOString(),
          durationMinutes: this.durationMinutes(),
          reasonForVisit: this.reasonForVisit(),
          notes: this.notes(),
        });
      });
  }
}
