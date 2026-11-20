import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from '@/components/Toast/ToastProvider';
import { AuthProvider, Login, ProtectedRoute, useAuth } from '@/features/auth';
import { RoleHome, AdminHomePage } from '@/features/home';
import { ClientPetsPage, VetPetsPage } from '@/features/pets';
import { ClientAppointmentsPage, Scheduler, ReceptionistAppointmentsPage, AdminAppointmentsPage } from '@/features/appointments';
import { AdminTreatmentsPage, ClientTreatmentsPage, TreatmentDetailPage, VetTreatmentsPage } from '@/features/treatments';
import { AdminHistoryPage, ClientHistoryPage, VetHistoryPage } from '@/features/history';
import { AdminPaymentsPage, ClientPaymentsPage, ReceptionistPaymentsPage } from '@/features/payments';
import { ProfilePage } from '@/features/profile';
import { AdminUsersPage, ReceptionistClientsPage } from '@/features/users';

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

function PetsRoute() {
  const { user } = useAuth();

  return user?.role === 'veterinarian'
    ? <VetPetsPage />
    : <ClientPetsPage />;
}

function TreatmentsRoute() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminTreatmentsPage />;
  }

  if (user?.role === 'veterinarian') {
    return <VetTreatmentsPage />;
  }

  return <ClientTreatmentsPage />;
}

function HistoryRoute() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminHistoryPage />;
  }

  if (user?.role === 'veterinarian') {
    return <VetHistoryPage />;
  }

  return <ClientHistoryPage />;
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
                <ProtectedRoute allowedRoles={['client', 'veterinarian', 'receptionist', 'admin']}>
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
                <ProtectedRoute allowedRoles={['client', 'veterinarian']}>
                  <PetsRoute />
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
                <ProtectedRoute allowedRoles={['client', 'admin', 'veterinarian']}>
                  <TreatmentsRoute />
                </ProtectedRoute>
              }
            />

            <Route
              path="/treatments/:treatmentId"
              element={
                <ProtectedRoute allowedRoles={['client', 'admin', 'veterinarian']}>
                  <TreatmentDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={['client', 'admin', 'veterinarian']}>
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
