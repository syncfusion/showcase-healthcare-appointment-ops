import { Component, inject, ChangeDetectionStrategy, signal, computed, ViewChild, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { SidebarModule, SidebarComponent } from '@syncfusion/ej2-angular-navigations';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { ThemeSwitcherComponent } from '../shared/theme-switcher/theme-switcher.component';
import {
  LucideLayoutDashboard,
  LucideCalendarDays,
  LucideUsers,
  LucideClock,
  LucideStethoscope,
  LucideBarChart3,
  LucideSettings,
  LucideChevronLeft,
  LucideChevronRight,
  LucideHeartPulse,
  LucideMenu,
} from '@lucide/angular';

const MOBILE_BREAKPOINT = 768;

interface NavItem {
  route: string;
  label: string;
  description: string;
  iconKey: 'dashboard' | 'schedule' | 'patients' | 'waitlist' | 'providers' | 'reports' | 'settings';
}

const navItems: NavItem[] = [
  { route: '/dashboard', label: 'Dashboard', description: 'At-a-glance KPIs, upcoming appointments, and department activity.', iconKey: 'dashboard' },
  { route: '/schedule', label: 'Schedule', description: 'View and manage provider schedules and book appointments.', iconKey: 'schedule' },
  { route: '/patients', label: 'Patients', description: 'Browse patient records, demographics, and appointment history.', iconKey: 'patients' },
  { route: '/waitlist', label: 'Waitlist', description: 'Monitor pending appointment requests and optimize slot allocation.', iconKey: 'waitlist' },
  { route: '/providers', label: 'Providers', description: 'Review provider profiles, utilization, and availability.', iconKey: 'providers' },
  { route: '/reports', label: 'Reports', description: 'Analyze appointment volume, no-shows, and utilization trends.', iconKey: 'reports' },
  { route: '/settings', label: 'Settings', description: 'Configure departments, locations, and portal appearance.', iconKey: 'settings' },
];

interface HeaderInfo {
  label: string;
  description?: string;
  iconKey?: NavItem['iconKey'];
}

function resolveHeaderInfo(url: string): HeaderInfo {
  const exact = navItems.find((n) => n.route === url || url.startsWith(n.route + '/'));
  if (exact) return exact;
  if (url.startsWith('/patients/'))
    return { label: 'Patient Details', description: 'Demographics, clinical history, medications, care plan, and appointments.', iconKey: 'patients' };
  if (url.startsWith('/providers/'))
    return { label: 'Provider Details', description: 'Provider profile, schedule, utilization, and availability.', iconKey: 'providers' };
  return { label: 'Healthcare Portal' };
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarModule,
    ButtonModule,
    ThemeSwitcherComponent,
    LucideLayoutDashboard,
    LucideCalendarDays,
    LucideUsers,
    LucideClock,
    LucideStethoscope,
    LucideBarChart3,
    LucideSettings,
    LucideChevronLeft,
    LucideChevronRight,
    LucideHeartPulse,
    LucideMenu,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  @ViewChild('sidebar') sidebar?: SidebarComponent;
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly nav = navItems;
  readonly isDockedCollapsed = signal(false);
  readonly activeUrl = signal('/dashboard');
  readonly expandedWidth = '220px';
  readonly dockWidth = '60px';
  readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);

  readonly mobileOpen = signal(
    typeof window !== 'undefined' && window.innerWidth >= MOBILE_BREAKPOINT
  );
  readonly mediaQuery: object =
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`) : {};

  readonly sidebarType = computed(() => (this.isMobile() ? 'Over' : 'Auto'));
  readonly enableDock = computed(() => !this.isMobile());
  readonly isOpen = computed(() => (this.isMobile() ? this.mobileOpen() : true));
  readonly headerInfo = computed<HeaderInfo>(() => resolveHeaderInfo(this.activeUrl()));

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects)
      )
      .subscribe((url) => {
        this.activeUrl.set(url);
        if (this.isMobile()) this.mobileOpen.set(false);
      });

    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      this.isMobile.set(mobile);
      if (!mobile) this.mobileOpen.set(true);
    };
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileOpen.update((o) => !o);
    } else {
      this.sidebar?.toggle();
      this.isDockedCollapsed.update((c) => !c);
    }
  }

  onSidebarClose(): void {
    if (this.isMobile()) this.mobileOpen.set(false);
  }

  isActive(route: string): boolean {
    const url = this.activeUrl();
    return url === route || url.startsWith(route + '/');
  }
}

