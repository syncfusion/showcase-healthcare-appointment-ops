import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import {
  GridModule,
  PageService,
  SortService,
  ToolbarService,
  EditService,
} from '@syncfusion/ej2-angular-grids';
import { HealthcareService } from '../../core/api/healthcare.service';
import { okOrThrow } from '../../core/api/api.service';
import { createAsyncResult } from '../../core/async/async-result';
import { ThemeService, ThemeMode } from '../../core/theme/theme.service';
import { ErrorBannerComponent } from '../../shared/error-banner/error-banner.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import type { DepartmentDto, LocationDto } from '../../core/models/dtos';

type SettingsTab = 'departments' | 'locations' | 'theme';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'system', label: 'System' },
];

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, GridModule, ErrorBannerComponent, LoadingStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
  providers: [PageService, SortService, ToolbarService, EditService],
})
export class SettingsPageComponent {
  private healthcare = inject(HealthcareService);
  protected themeService = inject(ThemeService);

  readonly activeTab = signal<SettingsTab>('departments');
  readonly themeOptions = THEME_OPTIONS;
  readonly tabs: { id: SettingsTab; label: string }[] = [
    { id: 'departments', label: 'Departments' },
    { id: 'locations', label: 'Locations' },
    { id: 'theme', label: 'Appearance' },
  ];

  readonly pageSettings = { pageSize: 20 };

  private readonly departmentsState = createAsyncResult<DepartmentDto[]>(() =>
    this.healthcare.listDepartments().pipe(map((res) => okOrThrow(res)))
  );
  private readonly locationsState = createAsyncResult<LocationDto[]>(() =>
    this.healthcare.listLocations().pipe(map((res) => okOrThrow(res)))
  );

  readonly departments = computed(() => this.departmentsState.data ?? []);
  readonly locations = computed(() => this.locationsState.data ?? []);
  readonly departmentsLoading = computed(() => this.departmentsState.loading);
  readonly locationsLoading = computed(() => this.locationsState.loading);
  readonly departmentsError = computed(() => this.departmentsState.error);
  readonly locationsError = computed(() => this.locationsState.error);

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }

  retryDepartments(): void {
    this.departmentsState.refresh();
  }

  retryLocations(): void {
    this.locationsState.refresh();
  }
}

