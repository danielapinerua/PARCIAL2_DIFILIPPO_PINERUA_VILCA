import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments, updateAppointment } from '@/features/appointments';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { toISODate } from '@/utils/dates';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import Spinner from '@/components/Spinner/Spinner';
import Table from '@/components/Table/Table';
import useToast from '@/components/Toast/useToast';
import './ReceptionistHomePage.css';

const STATUS = {
    pending: { label: 'Pendiente', color: 'yellow' },
    confirmed: { label: 'Confirmado', color: 'blue' },
    completed: { label: 'Realizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio', isActive: true },
    { href: '/schedule', label: 'Mi agenda' },
    { href: '/appointments', label: 'Turnos' },
    { href: '/clients', label: 'Clientes y mascotas' },
    { href: '/payments', label: 'Pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

const formatDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

function ReceptionistHomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [toConfirm, setToConfirm] = useState(null);

    useEffect(() => {
        let active = true;

        Promise.all([getAppointments(), getPets(), getUsers()])
            .then(([appointmentsData, petsData, usersData]) => {
                if (!active) return;
                setAppointments(appointmentsData);
                setPets(petsData);
                setUsers(usersData);
            })
            .catch((err) => {
                if (active) setError(err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const getPet = (petId) => pets.find((p) => p.id === petId);
    const getPetName = (petId) => getPet(petId)?.name ?? 'Sin datos';
    const getOwnerName = (petId) => {
        const owner = users.find((u) => u.id === getPet(petId)?.ownerId);
        return owner ? `${owner.firstName} ${owner.lastName}` : 'Sin datos';
    };
    const getVetName = (vetId) => {
        const vet = users.find((u) => u.id === vetId);
        return vet ? `Dr. ${vet.firstName} ${vet.lastName}` : 'Sin asignar';
    };

    const today = toISODate(new Date());
    const todayLabel = new Date().toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    // Turnos de hoy de todos los veterinarios
    const todayAppointments = useMemo(
        () =>
            appointments
                .filter((a) => a.date === today)
                .sort((a, b) => a.time.localeCompare(b.time)),
        [appointments, today]
    );

    // Turnos pendientes de confirmar, de hoy en adelante
    const pendingAppointments = useMemo(
        () =>
            appointments
                .filter((a) => a.status === 'pending' && a.date >= today)
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
        [appointments, today]
    );

    const handleConfirm = async () => {
        if (!toConfirm) return;

        const current = toConfirm;
        setSaving(true);

        try {
            const updated = await updateAppointment(current.id, { status: 'confirmed' });
            setAppointments((currentAppointments) =>
                currentAppointments.map((appointment) =>
                    appointment.id === updated.id
                        ? { ...appointment, ...updated }
                        : appointment
                )
            );
            toast.success(`Turno de ${getPetName(current.petId)} confirmado.`);
            setToConfirm(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <AppLayout
                sidebarItems={SIDEBAR_ITEMS}
                userName={`${user.firstName} ${user.lastName}`}
                roleLabel="Recepción"
                roleColor="yellow"
                onLogout={handleLogout}
            >
                <Spinner />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout
                sidebarItems={SIDEBAR_ITEMS}
                userName={`${user.firstName} ${user.lastName}`}
                roleLabel="Recepción"
                roleColor="yellow"
                onLogout={handleLogout}
            >
                <EmptyState title="No se pudieron cargar los turnos" message={error} />
            </AppLayout>
        );
    }

    const confirmAction = {
        key: 'actions',
        header: '',
        render: (row) =>
            row.status === 'pending' ? (
                <Button size="sm" onClick={() => setToConfirm(row)}>
                    Confirmar
                </Button>
            ) : null,
    };

    const baseColumns = [
        { key: 'time', header: 'Hora' },
        { key: 'pet', header: 'Mascota', render: (row) => getPetName(row.petId) },
        { key: 'owner', header: 'Dueño', render: (row) => getOwnerName(row.petId) },
        { key: 'vet', header: 'Veterinario', render: (row) => getVetName(row.veterinarianId) },
        { key: 'reason', header: 'Motivo' },
    ];

    const todayColumns = [
        ...baseColumns,
        {
            key: 'status',
            header: 'Estado',
            render: (row) => (
                <Badge color={STATUS[row.status].color}>{STATUS[row.status].label}</Badge>
            ),
        },
        confirmAction,
    ];

    const pendingColumns = [
        { key: 'date', header: 'Fecha', render: (row) => formatDate(row.date) },
        ...baseColumns,
        confirmAction,
    ];

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Recepción"
            roleColor="yellow"
            onLogout={handleLogout}
        >
            <div className="reception-home">
                <PageHeader
                    title={`Hola, ${user.firstName}`}
                    subtitle={`Turnos del ${todayLabel}`}
                />

                <Card title="Turnos de hoy">
                    {todayAppointments.length > 0 ? (
                        <Table columns={todayColumns} data={todayAppointments} />
                    ) : (
                        <EmptyState
                            title="No hay turnos para hoy"
                            message="Los turnos agendados para hoy van a aparecer acá."
                        />
                    )}
                </Card>

                <Card title={`Pendientes de confirmar (${pendingAppointments.length})`}>
                    {pendingAppointments.length > 0 ? (
                        <Table columns={pendingColumns} data={pendingAppointments} />
                    ) : (
                        <EmptyState
                            title="No hay turnos pendientes"
                            message="Cuando un cliente solicite un turno, va a aparecer acá para confirmarlo."
                        />
                    )}
                </Card>
            </div>

            <ConfirmDialog
                isOpen={Boolean(toConfirm)}
                title="Confirmar turno"
                message={
                    toConfirm
                        ? `El turno de ${getPetName(toConfirm.petId)} del ${formatDate(toConfirm.date)} a las ${toConfirm.time} quedará confirmado.`
                        : ''
                }
                confirmLabel={saving ? 'Confirmando…' : 'Confirmar turno'}
                onConfirm={handleConfirm}
                onCancel={() => setToConfirm(null)}
            />
        </AppLayout>
    );
}

export default ReceptionistHomePage;
