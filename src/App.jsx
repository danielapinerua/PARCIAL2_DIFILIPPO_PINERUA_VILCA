import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from '@/components/Toast/ToastProvider';
import { AuthProvider, Login, ProtectedRoute } from '@/features/auth';
import { RoleHome } from '@/features/home';

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
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <h1>Panel de administración</h1>
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
