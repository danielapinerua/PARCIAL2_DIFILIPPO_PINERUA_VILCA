import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {

    const { isLoggedIn, user } = useAuth();

    // Si no inició sesión, lo enviamos al login
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Si tiene un rol no autorizado, lo enviamos a su inicio
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // Si está autorizado, mostramos la página
    return children;
}