import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '@/features/users';
import { getPets } from '@/features/pets';
import { getAppointments } from '@/features/appointments';
import { getTreatments } from '@/features/treatments';
import { getPayments } from '@/features/payments';

import AppLayout from '@/components/AppLayout/AppLayout';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import Spinner from '@/components/Spinner/Spinner';
import StatCard from '@/components/StatCard/StatCard';

import './AdminHomePage.css';

function AdminHomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [
                nextUsers,
                nextPets,
                nextAppointments,
                nextTreatments,
                nextPayments,
            ] = await Promise.all([
                getUsers(),
                getPets(),
                getAppointments(),
                getTreatments(),
                getPayments(),
            ]);

            setUsers(nextUsers);
            setPets(nextPets);
            setAppointments(nextAppointments);
            setTreatments(nextTreatments);
            setPayments(nextPayments);
            setError('');
        } catch (err) {
            setError(err.message || 'No se pudo cargar el panel.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Estadísticas de usuarios
    const totalUsuarios = users.length;
    const totalClientes = users.filter((item) => item.role === 'client').length;

    // Estadísticas de mascotas
    const totalMascotas = pets.length;
    const mascotasActivas = pets.filter((item) => item.active).length;

    // Estadísticas de turnos
    const totalTurnos = appointments.length;
    const turnosPendientes = appointments.filter(
        (item) => item.status === 'pending'
    ).length;
    const turnosConfirmados = appointments.filter(
        (item) => item.status === 'confirmed'
    ).length;
    const turnosCompletados = appointments.filter(
        (item) => item.status === 'completed'
    ).length;
    const turnosCancelados = appointments.filter(
        (item) => item.status === 'cancelled'
    ).length;

    // Estadísticas de tratamientos
    const totalTratamientos = treatments.length;
    const tratamientosActivos = treatments.filter(
        (item) => item.status === 'active'
    ).length;

    // Ingresos registrados
    const totalIngresos = payments.reduce(
        (total, payment) => total + payment.amount,
        0
    );

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

                {loading ? (
                    <div className="admin-home__center">
                        <Spinner label="Cargando panel…" />
                    </div>
                ) : error ? (
                    <EmptyState
                        title="No se pudo cargar el panel"
                        message={error}
                        action={<Button onClick={loadData}>Reintentar</Button>}
                    />
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </AppLayout>
    );
}

export default AdminHomePage;
