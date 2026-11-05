import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from '@/components/Toast/ToastProvider';
import { AuthProvider, Login, ProtectedRoute, useAuth } from '@/features/auth';
import { RoleHome, AdminHomePage } from '@/features/home';
import { ClientPetsPage } from '@/features/pets';
import { ClientAppointmentsPage, Scheduler, ReceptionistAppointmentsPage, AdminAppointmentsPage } from '@/features/appointments';
import { ClientTreatmentsPage } from '@/features/treatments';
import { ClientHistoryPage } from '@/features/history';
import { ClientPaymentsPage, ReceptionistPaymentsPage} from '@/features/payments';
import { ProfilePage } from '@/features/profile';
import { AdminUsersPage, ReceptionistClientsPage} from '@/features/users';
import { AdminTreatmentsPage } from '@/features/treatments';
import { AdminHistoryPage } from '@/features/history';
import { AdminPaymentsPage } from '@/features/payments';

function AppointmentsRoute() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminAppointmentsPage />;
  }

  if (user?.role === 'receptionist') {
    return <ReceptionistAppointmentsPage />;
  }

  return <ClientAppointmentsPage />;
}

function TreatmentsRoute() {
  const { user } = useAuth();

  return user?.role === 'admin'
    ? <AdminTreatmentsPage />
    : <ClientTreatmentsPage />;
}

function HistoryRoute() {
  const { user } = useAuth();

  return user?.role === 'admin'
    ? <AdminHistoryPage />
    : <ClientHistoryPage />;
}

function PaymentsRoute() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminPaymentsPage />;
  }

  if (user?.role === 'receptionist') {
    return <ReceptionistPaymentsPage />;
  }

  return <ClientPaymentsPage />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute allowedRoles={['client', 'veterinarian', 'receptionist']}>
                  <RoleHome />
                </ProtectedRoute>
              }
            />

            <Route
              path="/schedule"
              element={
                <ProtectedRoute allowedRoles={['veterinarian', 'receptionist']}>
                  <Scheduler />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pets"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientPetsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments"
              element={
                <ProtectedRoute allowedRoles={['client', 'admin', 'receptionist']}>
                  <AppointmentsRoute />
                </ProtectedRoute>
              }
            />

            <Route
              path="/treatments"
              element={
                <ProtectedRoute allowedRoles={['client', 'admin']}>
                  <TreatmentsRoute />
                </ProtectedRoute>
              }
            />
            
            <Route
            path="/history"
            element={
            <ProtectedRoute allowedRoles={['client', 'admin']}>
              <HistoryRoute />
              </ProtectedRoute>
            }
            />

            <Route
            path="/payments"
            element={
            <ProtectedRoute allowedRoles={['client', 'admin', 'receptionist']}>
              <PaymentsRoute />
              </ProtectedRoute>
            }
            />


            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['client', 'veterinarian', 'receptionist', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminHomePage />
                </ProtectedRoute>
              }
            />
            <Route
            path="/users"
            element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
              </ProtectedRoute>
            }
            />
            <Route
            path="/clients"
            element={
            <ProtectedRoute allowedRoles={['receptionist']}>
              <ReceptionistClientsPage />
              </ProtectedRoute>
            }
            />

            <Route path="*" element={<h1>Página no encontrada - 404</h1>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
