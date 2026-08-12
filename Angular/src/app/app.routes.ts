import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent),
        title: 'Dashboard | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'appointments',
        loadComponent: () => import('./pages/appointments/appointments-page.component').then(m => m.AppointmentsPageComponent),
        title: 'Appointments | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'patients',
        loadComponent: () => import('./pages/patients/patients-page.component').then(m => m.PatientsPageComponent),
        title: 'Patients | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./pages/patients/patient-detail-page.component').then(m => m.PatientDetailPageComponent),
        title: 'Patient Details | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'providers',
        loadComponent: () => import('./pages/providers/provider-list-page.component').then(m => m.ProviderListPageComponent),
        title: 'Providers | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'providers/:id',
        loadComponent: () => import('./pages/providers/provider-detail-page.component').then(m => m.ProviderDetailPageComponent),
        title: 'Provider Details | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'schedule',
        loadComponent: () => import('./pages/schedule/schedule-page.component').then(m => m.SchedulePageComponent),
        title: 'Schedule | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/analytics/analytics-page.component').then(m => m.AnalyticsPageComponent),
        title: 'Analytics | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'ai',
        loadComponent: () => import('./pages/ai/ai-page.component').then(m => m.AiPageComponent),
        title: 'AI Assistant | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'waitlist',
        loadComponent: () => import('./pages/waitlist/waitlist-page.component').then(m => m.WaitlistPageComponent),
        title: 'Waitlist | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports-page.component').then(m => m.ReportsPageComponent),
        title: 'Reports | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit/audit-page.component').then(m => m.AuditPageComponent),
        title: 'Audit Logs | Healthcare Appointment and Patient Operations Portal',
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings-page.component').then(m => m.SettingsPageComponent),
        title: 'Settings | Healthcare Appointment and Patient Operations Portal',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard', pathMatch: 'full' },
];
