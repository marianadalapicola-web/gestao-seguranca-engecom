import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RequirePermission } from './routes/RequirePermission';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { IdsPage } from './features/ids/IdsPage';
import { RitualsPage } from './features/rituals/RitualsPage';
import { DdsPage } from './features/dds/DdsPage';
import { InspectionsPage } from './features/inspections/InspectionsPage';
import { DeviationsPage } from './features/deviations/DeviationsPage';
import { IncidentsPage } from './features/incidents/IncidentsPage';
import { RefusalRightsPage } from './features/refusalRights/RefusalRightsPage';
import { ManagerialInspectionsPage } from './features/managerialInspections/ManagerialInspectionsPage';
import { ActionPlansPage } from './features/actionPlans/ActionPlansPage';
import { IndicatorsPage } from './features/indicators/IndicatorsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { UsersPage } from './features/users/UsersPage';
import { AuditPage } from './features/audit/AuditPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { NotFoundPage } from './features/misc/NotFoundPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
              <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="ids" element={<RequirePermission module="ids"><IdsPage /></RequirePermission>} />
                <Route path="rituais" element={<RequirePermission module="rituals"><RitualsPage /></RequirePermission>} />
                <Route path="dds" element={<RequirePermission module="dds"><DdsPage /></RequirePermission>} />
                <Route path="inspecoes" element={<RequirePermission module="inspections"><InspectionsPage /></RequirePermission>} />
                <Route path="desvios" element={<RequirePermission module="deviations"><DeviationsPage /></RequirePermission>} />
                <Route path="incidentes" element={<RequirePermission module="incidents"><IncidentsPage /></RequirePermission>} />
                <Route
                  path="direito-de-recusa"
                  element={
                    <RequirePermission module="refusalRights">
                      <RefusalRightsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="inspecao-gerencial"
                  element={
                    <RequirePermission module="managerialInspections">
                      <ManagerialInspectionsPage />
                    </RequirePermission>
                  }
                />
                <Route path="planos-de-acao" element={<RequirePermission module="actionPlans"><ActionPlansPage /></RequirePermission>} />
                <Route path="indicadores" element={<RequirePermission module="indicators"><IndicatorsPage /></RequirePermission>} />
                <Route path="relatorios" element={<RequirePermission module="reports"><ReportsPage /></RequirePermission>} />
                <Route path="notificacoes" element={<NotificationsPage />} />
                <Route path="usuarios" element={<RequirePermission module="users"><UsersPage /></RequirePermission>} />
                <Route path="auditoria" element={<RequirePermission module="audit"><AuditPage /></RequirePermission>} />
                <Route path="configuracoes" element={<RequirePermission module="config"><SettingsPage /></RequirePermission>} />
                <Route path="perfil" element={<ProfilePage />} />

                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
