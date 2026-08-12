import {
  Component,
  Input,
  ChangeDetectionStrategy,
  computed,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ScheduleModule,
  ScheduleComponent,
  EventSettingsModel,
  EventRenderedArgs,
  DayService,
  WeekService,
  MonthService,
} from '@syncfusion/ej2-angular-schedule';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { getAppointmentColor, chooseTextColor } from '../../core/utils/appointment-colors';
import type { AppointmentSummaryDto } from '../../core/models/dtos';

interface ScheduleEvent {
  Id: string;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  Status: string;
  CategoryColor: string;
}

@Component({
  selector: 'app-provider-schedule-tab',
  standalone: true,
  imports: [
    CommonModule,
    ScheduleModule,
    LoadingStateComponent,
    ErrorBannerComponent,
  ],
  providers: [DayService, WeekService, MonthService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './provider-schedule-tab.component.html',
  styleUrl: './provider-schedule-tab.component.scss',
})
export class ProviderScheduleTabComponent {
  @Input({ required: true }) set appointments(value: AppointmentSummaryDto[]) {
    this._appointments.set(value ?? []);
  }
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input({ required: true }) selectedDate!: Date;
  @Input() onRetry: () => void = () => {};

  @ViewChild(ScheduleComponent) schedule?: ScheduleComponent;

  private readonly _appointments = signal<AppointmentSummaryDto[]>([]);

  readonly events = computed<ScheduleEvent[]>(() =>
    this._appointments().map((a) => ({
      Id: a.appointmentId,
      Subject: `${a.patientName} — ${a.appointmentType}`,
      StartTime: new Date(a.scheduledDateTime),
      EndTime: new Date(new Date(a.scheduledDateTime).getTime() + a.durationMinutes * 60000),
      Status: a.status,
      CategoryColor: getAppointmentColor(a.appointmentType),
    }))
  );

  readonly eventSettings = computed<EventSettingsModel>(() => ({
    dataSource: this.events(),
    fields: {
      id: 'Id',
      subject: { name: 'Subject' },
      startTime: { name: 'StartTime' },
      endTime: { name: 'EndTime' },
    },
  } as EventSettingsModel));

  onEventRendered(args: EventRenderedArgs): void {
    const data = args.data as unknown as ScheduleEvent;
    const bg = data?.CategoryColor;
    if (!bg || !args.element) return;
    args.element.style.backgroundColor = bg;
    args.element.style.color = chooseTextColor(bg);
    args.element.style.borderColor = bg;
    args.element.querySelectorAll<HTMLElement>('.e-subject, .e-time, .e-date-time').forEach((node) => {
      node.style.color = 'inherit';
    });
  }

  retry(): void {
    this.onRetry();
  }
}
