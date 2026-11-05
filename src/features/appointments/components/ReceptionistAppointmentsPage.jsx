
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { getAppointments, updateAppointment } from '../api';

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

const STATUS = {
    pending: { label: 'Pendiente', color: 'yellow' },
    confirmed: { label: 'Confirmado', color: 'blue' },
    completed: { label: 'Realizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/schedule', label: 'Mi agenda' },
    { href: '/appointments', label: 'Turnos', isActive: true },
    { href: '/clients', label: 'Clientes y mascotas' },
    { href: '/payments', label: 'Pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

function ReceptionistAppointmentsPage() {
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

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [appointmentsData, petsData, usersData] =
                await Promise.all([
                    getAppointments(),
                    getPets(),
                    getUsers(),
                ]);

            setAppointments(appointmentsData);
            setPets(petsData);
            setUsers(usersData);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getPetName = (petId) => {
        const pet = pets.find((item) => item.id === petId);
        return pet ? pet.name : 'Mascota no encontrada';
    };

    const getOwnerName = (petId) => {
        const pet = pets.find((item) => item.id === petId);
        if (!pet) return 'No disponible';

        const owner = users.find((item) => item.id === pet.ownerId);

        return owner
            ? `${owner.firstName} ${owner.lastName}`
            : 'No disponible';
    };

    const getVetName = (veterinarianId) => {
        const vet = users.find((item) => item.id === veterinarianId);

        return vet
            ? `Dr. ${vet.firstName} ${vet.lastName}`
            : 'Sin asignar';
    };

    const formatDate = (date) => {
        if (!date) return '-';

        return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR');
    };

    const handleConfirm = async () => {
        if (!toConfirm) return;

        const current = toConfirm;
        setSaving(true);

        try {
            const updated = await updateAppointment(current.id, {
                status: 'confirmed',
            });

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

    const columns = [
        {
            key: 'date',
            header: 'Fecha',
            render: (row) => formatDate(row.date),
        },
        {
            key: 'time',
            header: 'Hora',
        },
        {
            key: 'pet',
            header: 'Mascota',
            render: (row) => getPetName(row.petId),
        },
        {
            key: 'owner',
            header: 'Cliente',
            render: (row) => getOwnerName(row.petId),
        },
        {
            key: 'veterinarian',
            header: 'Veterinario',
            render: (row) => getVetName(row.veterinarianId),
        },
        {
            key: 'reason',
            header: 'Motivo',
        },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => {
                const status = STATUS[row.status];

                return (
                    <Badge color={status?.color || 'gray'}>
                        {status?.label || row.status}
                    </Badge>
                );
            },
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (row) =>
                row.status === 'pending' ? (
                    <Button size="sm" onClick={() => setToConfirm(row)}>
                        Confirmar
                    </Button>
                ) : null,
        },
    ];

    const sortedAppointments = [...appointments].sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );

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

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Recepción"
            roleColor="yellow"
            onLogout={handleLogout}
        >
            <div className="reception-appointments">
                <PageHeader
                    title="Turnos"
                    subtitle="Consultá y gestioná los turnos de los clientes."
                />

                <Card>
                    {error ? (
                        <EmptyState
                            title="No se pudieron cargar los turnos"
                            message={error}
                            action={
                                <Button onClick={loadData}>
                                    Reintentar
                                </Button>
                            }
                        />
                    ) : (
                        <Table
                            columns={columns}
                            data={sortedAppointments}
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

export default ReceptionistAppointmentsPage;
