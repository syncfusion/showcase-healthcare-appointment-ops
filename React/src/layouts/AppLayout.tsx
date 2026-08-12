import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock,
  Stethoscope,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Menu,
} from 'lucide-react';
import { ThemeSwitcher } from '../components/shared/ThemeSwitcher';







const MOBILE_BREAKPOINT = 768;

interface NavItem {
  to: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', description: 'At-a-glance KPIs, upcoming appointments, and department activity.', icon: LayoutDashboard },
  { to: '/schedule', label: 'Schedule', description: 'View and manage provider schedules and book appointments.', icon: CalendarDays },
  { to: '/patients', label: 'Patients', description: 'Browse patient records, demographics, and appointment history.', icon: Users },
  { to: '/waitlist', label: 'Waitlist', description: 'Monitor pending appointment requests and optimize slot allocation.', icon: Clock },
  { to: '/providers', label: 'Providers', description: 'Review provider profiles, utilization, and availability.', icon: Stethoscope },
  { to: '/reports', label: 'Reports', description: 'Analyze appointment volume, no-shows, and utilization trends.', icon: BarChart3 },
  { to: '/settings', label: 'Settings', description: 'Configure departments, locations, and portal appearance.', icon: Settings },
];

const EXPANDED_WIDTH = '220px';
const DOCK_WIDTH = '60px';

const APP_TITLE_SUFFIX = 'Healthcare Appointment and Patient Operations Portal';

interface HeaderInfo {
  label: string;
  description?: string;
  icon?: React.ElementType;
}


function resolveHeaderInfo(pathname: string): HeaderInfo {
  const exact = navItems.find((n) => n.to === pathname);
  if (exact) return exact;
  if (pathname.startsWith('/patients/'))
    return { label: 'Patient Details', description: 'Demographics, clinical history, medications, care plan, and appointments.', icon: Users };
  if (pathname.startsWith('/providers/'))
    return { label: 'Provider Details', description: 'Provider profile, schedule, utilization, and availability.', icon: Stethoscope };
  return { label: 'Healthcare Portal' };
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sidebarRef = useRef<SidebarComponent>(null);
  const [isDockedCollapsed, setIsDockedCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  );

  const [mobileOpen, setMobileOpen] = useState(
    typeof window !== 'undefined' && window.innerWidth >= MOBILE_BREAKPOINT
  );
  const location = useLocation();


  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    setMobileOpen(false);
  }, [isMobile, location.pathname]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((o) => !o);
    } else {
      sidebarRef.current?.toggle();
      setIsDockedCollapsed((c) => !c);
    }
  };

  const closeMobileSidebar = () => setMobileOpen(false);

  const headerInfo = resolveHeaderInfo(location.pathname);

  useEffect(() => {
    document.title = `${headerInfo.label} | ${APP_TITLE_SUFFIX}`;
  }, [headerInfo.label]);

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <SidebarComponent
        ref={sidebarRef}
        id="app-sidebar"
        type={isMobile ? 'Over' : 'Auto'}
        enableDock={!isMobile}
        dockSize={DOCK_WIDTH}
        width={EXPANDED_WIDTH}
        mediaQuery={`(max-width: ${MOBILE_BREAKPOINT - 1}px)`}
        isOpen={isMobile ? mobileOpen : true}
        closeOnDocumentClick={isMobile}
        showBackdrop={isMobile}
        close={closeMobileSidebar}
        style={{
          background: 'var(--color-sf-bg-primary)',
          color: 'var(--color-sf-fg-secondary)',
          borderRight: '1px solid var(--color-sf-border-secondary)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div
            className="sidebar-logo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '20px 16px 12px',
              fontWeight: 700,
              fontSize: 18,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              color: 'var(--color-sf-fg-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            <span className="sidebar-logo-icon" style={{ color: 'var(--color-sf-fg-brand-primary)', lineHeight: 0, flexShrink: 0 }}>
              <HeartPulse size={24} strokeWidth={2} />
            </span>
            <span className="sidebar-logo-full">Meridian Health</span>
          </div>

          
          <nav id="app-sidebar-nav" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 10px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? 'sidebar-nav-link active' : 'sidebar-nav-link'
                  }
                >
                  <span className="sidebar-nav-icon">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {!isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-sf-fg-tertiary)',
                padding: 12,
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Toggle sidebar"
            >
              {isDockedCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>
      </SidebarComponent>

      
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <header
          style={{
            background: 'var(--color-sf-bg-primary)',
            borderBottom: '1px solid var(--color-sf-border-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 16px',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
          className="app-header"
        >
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {isMobile && (
              <button
                onClick={toggleSidebar}
                aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={mobileOpen}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-sf-border-secondary)',
                  borderRadius: 8,
                  color: 'var(--color-sf-fg-secondary)',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Menu size={18} />
              </button>
            )}
            {headerInfo.icon && (
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'var(--color-sf-bg-brand-primary)',
                  color: 'var(--color-sf-fg-brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {React.createElement(headerInfo.icon, { size: 20, strokeWidth: 2 })}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.2, color: 'var(--color-sf-fg-primary)' }}>
                {headerInfo.label}
              </h1>
              {headerInfo.description && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'var(--color-sf-fg-tertiary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {headerInfo.description}
                </p>
              )}
            </div>
          </div>

          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <ThemeSwitcher />
          </div>
        </header>

        
        <main style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--color-sf-bg-secondary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
