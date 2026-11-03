import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ToastProvider from '@/components/Toast/ToastProvider';
import HomePage from '@/pages/home/HomePage';

import AuthProvider from '@/contexts/AuthContext';
import ProtectedRoute from '@/contexts/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>

            <Route path="/" element={<HomePage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <h1>Panel principal</h1>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
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
