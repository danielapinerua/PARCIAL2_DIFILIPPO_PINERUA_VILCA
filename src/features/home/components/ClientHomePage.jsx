import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    getAppointments,
    getTreatments,
    getPets,
    getUsers,
    getPayments,
} from '@/services/storage';
import { toISODate } from '@/utils/dates';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProgressBar from '@/components/ProgressBar/ProgressBar';
import StatCard from '@/components/StatCard/StatCard';
import Table from '@/components/Table/Table';
import './ClientHomePage.css';

const STATUS = {
    pending: { label: 'Pendiente', color: 'yellow' },
    confirmed: { label: 'Confirmado', color: 'blue' },
    completed: { label: 'Realizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio', isActive: true },
    { href: '/pets', label: 'Mis mascotas' },
    { href: '/appointments', label: 'Mis turnos' },
    { href: '/treatments', label: 'Mis tratamientos' },
    { href: '/history', label: 'Historial clínico' },
    { href: '/payments', label: 'Mis pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

const formatDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const formatMoney = (value) =>
    value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function ClientHomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const appointments = getAppointments();
    const treatments = getTreatments();
    const payments = getPayments();
    const users = getUsers();
    const today = toISODate(new Date());

    // Solo las mascotas del cliente logueado
    const myPets = useMemo(
        () => getPets().filter((p) => p.ownerId === user.id && p.active),
        [user.id]
    );
    const myPetIds = myPets.map((p) => p.id);

    const getPetName = (petId) => myPets.find((p) => p.id === petId)?.name ?? 'Sin datos';
    const getVetName = (vetId) => {
        const vet = users.find((u) => u.id === vetId);
        return vet ? `Dr. ${vet.firstName} ${vet.lastName}` : 'Sin asignar';
    };

    // Próximos turnos: de hoy en adelante, pendientes o confirmados
    const upcomingAppointments = appointments
        .filter(
            (a) =>
                myPetIds.includes(a.petId) &&
                a.date >= today &&
                (a.status === 'pending' || a.status === 'confirmed')
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    // Tratamientos activos de sus mascotas, con progreso
    const activeTreatments = treatments
        .filter((t) => myPetIds.includes(t.petId) && t.status === 'active')
        .map((t) => ({
            ...t,
            completedSessions: appointments.filter(
                (a) => a.treatmentId === t.id && a.status === 'completed'
            ).length,
        }));

    // Saldo adeudado: monto de turnos realizados menos lo pagado
    const debt = appointments
        .filter((a) => myPetIds.includes(a.petId) && a.status === 'completed')
        .reduce((total, a) => {
            const paid = payments
                .filter((p) => p.appointmentId === a.id)
                .reduce((sum, p) => sum + p.amount, 0);
            return total + (a.amount - paid);
        }, 0);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const columns = [
        { key: 'date', header: 'Fecha', render: (row) => formatDate(row.date) },
        { key: 'time', header: 'Hora' },
        { key: 'pet', header: 'Mascota', render: (row) => getPetName(row.petId) },
        { key: 'vet', header: 'Veterinario', render: (row) => getVetName(row.veterinarianId) },
        { key: 'reason', header: 'Motivo' },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => (
                <Badge color={STATUS[row.status].color}>{STATUS[row.status].label}</Badge>
            ),
        },
    ];

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Cliente"
            roleColor="gray"
            onLogout={handleLogout}
        >
            <div className="client-home">
                <PageHeader
                    title={`Hola, ${user.firstName}`}
                    subtitle="Turnos, tratamientos y pagos de tus mascotas"
                    actions={
                        <Button onClick={() => navigate('/appointments')}>Solicitar turno</Button>
                    }
                />

                <div className="client-home__debt">
                    <StatCard label="Saldo adeudado" value={formatMoney(debt)} />
                </div>

                <Card title="Próximos turnos">
                    {upcomingAppointments.length > 0 ? (
                        <Table columns={columns} data={upcomingAppointments} />
                    ) : (
                        <EmptyState
                            title="No tenés turnos próximos"
                            message="Solicitá un turno para alguna de tus mascotas."
                            action={
                                <Button onClick={() => navigate('/appointments')}>
                                    Solicitar turno
                                </Button>
                            }
                        />
                    )}
                </Card>

                <section className="client-home__section">
                    <h2 className="client-home__title">Tratamientos activos</h2>
                    {activeTreatments.length > 0 ? (
                        <div className="client-home__treatments">
                            {activeTreatments.map((t) => (
                                <Card key={t.id} title={t.name}>
                                    <p className="client-home__pet">{getPetName(t.petId)}</p>
                                    <ProgressBar
                                        value={t.completedSessions}
                                        max={t.totalSessions}
                                        label={`${t.completedSessions}/${t.totalSessions} sesiones`}
                                    />
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Tus mascotas no tienen tratamientos activos"
                            message="Si el veterinario indica un tratamiento, vas a ver su progreso acá."
                        />
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

export default ClientHomePage;