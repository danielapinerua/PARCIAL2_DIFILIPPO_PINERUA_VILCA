import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from '@/components/Toast/ToastProvider';
import HomePage from '@/pages/home/HomePage';
import Login from '@/components/Login/Login';

import AuthProvider from '@/contexts/AuthContext';
import ProtectedRoute from '@/contexts/ProtectedRoute';

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
                  <h1>Inicio</h1>
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

            <Route path="/componentes" element={<HomePage />} />

            <Route path="*" element={<h1>Página no encontrada - 404</h1>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;