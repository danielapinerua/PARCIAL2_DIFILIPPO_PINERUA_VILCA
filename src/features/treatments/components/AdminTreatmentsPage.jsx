import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { getTreatments } from '../api';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import Table from '@/components/Table/Table';

function AdminTreatmentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [treatments, setTreatments] = useState([]);
    const [pets, setPets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [allTreatments, allPets, allUsers] = await Promise.all([
                getTreatments(),
                getPets(),
                getUsers(),
            ]);

            setTreatments(allTreatments);
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
    
    const STATUS = {
    active: { label: 'Activo', color: 'green' },
    completed: { label: 'Finalizado', color: 'blue' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

const columns = [
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
        key: 'name',
        header: 'Tratamiento',
    },
    {
        key: 'notes',
        header: 'Observaciones',
    },
    {
        key: 'totalSessions',
        header: 'Sesiones',
    },
    {
        key: 'startDateOffsetDays',
        header: 'Inicio',
        render: (row) => {
            const date = new Date();
            date.setDate(date.getDate() + row.startDateOffsetDays);

            return date.toLocaleDateString('es-AR');
        },
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

    const SIDEBAR_ITEMS = [
        { href: '/dashboard', label: 'Panel' },
        { href: '/users', label: 'Usuarios' },
        { href: '/appointments', label: 'Turnos' },
        { href: '/treatments', label: 'Tratamientos', isActive: true },
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
            <div className="admin-treatments">
                <PageHeader
                    title="Tratamientos"
                    subtitle="Consultá todos los tratamientos registrados en PataSana."
                />

                <Card>
                    {loadError ? (
                        <EmptyState
                            title="No se pudieron cargar los tratamientos"
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
                            data={treatments}
                            loading={loading}
                        />
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

export default AdminTreatmentsPage;