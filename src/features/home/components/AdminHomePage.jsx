import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';

import users from '@/features/users/mocks/users.json';
import pets from '@/features/pets/mocks/pets.json';
import appointments from '@/features/appointments/mocks/appointments.json';
import treatments from '@/features/treatments/mocks/treatments.json';
import payments from '@/features/payments/mocks/payments.json';

import AppLayout from '@/components/AppLayout/AppLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import Card from '@/components/Card/Card';
import StatCard from '@/components/StatCard/StatCard';

import './AdminHomePage.css';

function AdminHomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

        // Estadísticas de usuarios
    const totalUsuarios = users.length;
    const totalClientes = users.filter((u) => u.role === 'client').length;

    // Estadísticas de mascotas
    const totalMascotas = pets.length;
    const mascotasActivas = pets.filter((p) => p.active).length;

    // Estadísticas de turnos
    const totalTurnos = appointments.length;
    const turnosPendientes = appointments.filter((a) => a.status === 'pending').length;
    const turnosConfirmados = appointments.filter((a) => a.status === 'confirmed').length;
    const turnosCompletados = appointments.filter((a) => a.status === 'completed').length;
    const turnosCancelados = appointments.filter((a) => a.status === 'cancelled').length;

    // Estadísticas de tratamientos
    const totalTratamientos = treatments.length;
    const tratamientosActivos = treatments.filter((t) => t.status === 'active').length;

    // Ingresos registrados
    const totalIngresos = payments.reduce((total, payment) => total + payment.amount, 0);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppLayout
            sidebarItems={[
                { href: '/dashboard', label: 'Panel', isActive: true },
                { href: '/users', label: 'Usuarios' },
                { href: '/appointments', label: 'Turnos' },
                { href: '/treatments', label: 'Tratamientos' },
                { href: '/history', label: 'Historial clínico' },
                { href: '/payments', label: 'Pagos y balance' },
                { href: '/profile', label: 'Mi perfil' },
            ]}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Administrador"
            roleColor="blue"
            onLogout={handleLogout}
        >
            <div className="admin-home">
    <PageHeader
        title={`Hola, ${user.firstName}`}
        subtitle="Resumen general de PataSana"
    />

    <section className="admin-home__stats">
        <StatCard
            label="Usuarios registrados"
            value={totalUsuarios}
            icon="👥"
            trend={`${totalClientes} clientes`}
        />

        <StatCard
            label="Mascotas registradas"
            value={totalMascotas}
            icon="🐾"
            trend={`${mascotasActivas} activas`}
        />

        <StatCard
            label="Total de turnos"
            value={totalTurnos}
            icon="📅"
            trend={`${turnosPendientes} pendientes`}
        />

        <StatCard
            label="Tratamientos"
            value={totalTratamientos}
            icon="🩺"
            trend={`${tratamientosActivos} activos`}
        />

        <StatCard
            label="Ingresos registrados"
            value={`$${totalIngresos.toLocaleString('es-AR')}`}
            icon="💰"
            trend={`${payments.length} pagos registrados`}
        />
    </section>
    <section className="admin-home__details">
    <Card title="Estado de los turnos">
        <div className="admin-home__appointment-stats">
            <p>Pendientes: {turnosPendientes}</p>
            <p>Confirmados: {turnosConfirmados}</p>
            <p>Completados: {turnosCompletados}</p>
            <p>Cancelados: {turnosCancelados}</p>
        </div>
    </Card>
    </section>
</div>
        </AppLayout>
    );
}

export default AdminHomePage;