import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { getAppointments } from '../api';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import Button from '@/components/Button/Button';
import PageHeader from '@/components/PageHeader/PageHeader';
import Table from '@/components/Table/Table';

function AdminAppointmentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [allAppointments, allPets, allUsers] = await Promise.all([
                getAppointments(),
                getPets(),
                getUsers(),
            ]);

            setAppointments(allAppointments);
            setPets(allPets);
            setUsers(allUsers);
            setLoadError('');
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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
            ? `${vet.firstName} ${vet.lastName}`
            : 'No asignado';
    };

    const formatDate = (date) => {
        if (!date) return '-';

        return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR');
    };

    const STATUS = {
        pending: { label: 'Pendiente', color: 'yellow' },
        confirmed: { label: 'Confirmado', color: 'blue' },
        completed: { label: 'Realizado', color: 'green' },
        cancelled: { label: 'Cancelado', color: 'red' },
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
            header: 'Propietario',
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
    ];

    const sortedAppointments = [...appointments].sort((a, b) => {
        return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
    });

    const SIDEBAR_ITEMS = [
        { href: '/dashboard', label: 'Panel' },
        { href: '/users', label: 'Usuarios' },
        { href: '/appointments', label: 'Turnos', isActive: true },
        { href: '/treatments', label: 'Tratamientos' },
        { href: '/history', label: 'Historial clínico' },
        { href: '/payments', label: 'Pagos y balance' },
        { href: '/profile', label: 'Mi perfil' },
    ];

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Administrador"
            roleColor="blue"
            onLogout={handleLogout}
        >
            <div className="admin-appointments">
                <PageHeader
                    title="Turnos"
                    subtitle="Consultá todos los turnos registrados en PataSana."
                />

                <Card>
                    {loadError ? (
                        <EmptyState
                            title="No se pudieron cargar los turnos"
                            message={loadError}
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
                            loading={loading}
                        />
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

export default AdminAppointmentsPage;