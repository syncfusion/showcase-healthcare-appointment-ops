import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { fmtTime } from '../../core/utils/date-format';
import type { WaitlistEntryDto, SlotDto, ProviderSummaryDto } from '../../core/models/dtos';

function toDateOnly(value: string): Date {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatTime(value: string): string {
  return fmtTime(value);
}

function toLocalDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-slot-match-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, DropDownListModule, DatePickerModule, ButtonModule, ErrorBannerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slot-match-dialog.component.html',
  styleUrl: './slot-match-dialog.component.scss',
})
export class SlotMatchDialogComponent implements OnInit {
  private healthcare: HealthcareService;
  @Input({ required: true }) entry!: WaitlistEntryDto;
  @Output() close = new EventEmitter<void>();
  @Output() matched = new EventEmitter<void>();

  readonly providers = signal<ProviderSummaryDto[]>([]);
  readonly providerId = signal<string>('');
  readonly date = signal<Date>(new Date());
  readonly slots = signal<SlotDto[]>([]);
  readonly selectedSlot = signal<SlotDto | null>(null);
  readonly finding = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly providerFields = { text: 'lastName', value: 'providerId' };

  constructor(healthcare: HealthcareService) {
    this.healthcare = healthcare;
  }

  ngOnInit(): void {
    this.date.set(toDateOnly(this.entry.preferredDateRangeStart));
    this.healthcare
      .listProviders(this.entry.preferredDepartmentId)
      .pipe(map((res) => okOrThrow(res).items))
      .subscribe({
        next: (list) => {
          this.providers.set(list);
          if (!this.entry.preferredProviderId && list.length > 0) {
            this.providerId.set(list[0].providerId);
          } else if (this.entry.preferredProviderId) {
            this.providerId.set(this.entry.preferredProviderId);
          }
        },
        error: () => undefined,
      });
  }

  onProviderChange(value: string | null): void {
    this.providerId.set(value ?? '');
  }

  onDateChange(value: Date | string | null): void {
    if (value) this.date.set(new Date(value));
  }

  findSlots(): void {
    if (!this.providerId()) {
      this.error.set('Select a provider first.');
      return;
    }
    this.finding.set(true);
    this.error.set(null);
    this.selectedSlot.set(null);
    const iso = toLocalDateOnly(this.date());
    this.healthcare
      .getProviderAvailability(this.providerId(), iso)
      .pipe(map((res) => okOrThrow(res).filter((s) => s.isAvailable)))
      .subscribe({
        next: (available) => {
          this.slots.set(available);
          this.finding.set(false);
        },
        error: (err: unknown) => {
          this.error.set(err instanceof Error ? err.message : 'Could not load availability.');
          this.slots.set([]);
          this.finding.set(false);
        },
      });
  }

  selectSlot(s: SlotDto): void {
    this.selectedSlot.set(s);
  }

  confirmMatch(): void {
    const slot = this.selectedSlot();
    if (!slot) return;
    this.submitting.set(true);
    this.error.set(null);
    const durationMinutes = Math.max(
      15,
      Math.round((new Date(slot.slotEnd).getTime() - new Date(slot.slotStart).getTime()) / 60000)
    );
    this.healthcare
      .createAppointment({
        patientId: this.entry.patientId,
        providerId: slot.providerId,
        departmentId: this.entry.preferredDepartmentId,
        locationId: slot.locationId,
        appointmentType: this.entry.requestedAppointmentType,
        scheduledDateTime: slot.slotStart,
        durationMinutes,
        reasonForVisit: `Waitlist match — ${this.entry.requestedAppointmentType}`,
      })
      .pipe(map((res) => okOrThrow(res)))
      .subscribe({
        next: (created) => {
          this.healthcare
            .matchWaitlistEntry(this.entry.waitlistId, created.appointmentId)
            .pipe(map((res) => okOrThrow(res)))
            .subscribe({
              next: () => {
                this.submitting.set(false);
                this.matched.emit();
              },
              error: (err: unknown) => {
                this.error.set(err instanceof Error ? err.message : 'Appointment created but matching failed.');
                this.submitting.set(false);
              },
            });
        },
        error: (err: unknown) => {
          this.error.set(err instanceof Error ? err.message : 'Failed to create the appointment.');
          this.submitting.set(false);
        },
      });
  }

  get minDate(): Date {
    return toDateOnly(this.entry.preferredDateRangeStart);
  }

  get maxDate(): Date {
    return toDateOnly(this.entry.preferredDateRangeEnd);
  }

  formatTime = formatTime;
}
