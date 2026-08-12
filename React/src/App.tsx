import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { AppLayout } from '@layouts/AppLayout';
import { DashboardPage } from '@pages/DashboardPage';
import { SchedulePage } from '@pages/SchedulePage';
import { PatientListPage } from '@pages/PatientListPage';
import { PatientDetailPage } from '@pages/PatientDetailPage';
import { WaitlistPage } from '@pages/WaitlistPage';
import { ProviderListPage } from '@pages/ProviderListPage';
import { ProviderDetailPage } from '@pages/ProviderDetailPage';
import { ReportsPage } from '@pages/ReportsPage';
import { SettingsPage } from '@pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/patients" element={<PatientListPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/providers" element={<ProviderListPage />} />
          <Route path="/providers/:id" element={<ProviderDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
