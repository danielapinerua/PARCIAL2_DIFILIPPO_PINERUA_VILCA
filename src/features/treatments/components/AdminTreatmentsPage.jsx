import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { getTreatments } from '../api';
import {
    TREATMENT_STATUS,
    formatDate,
    getDisplayName,
    getRoleMeta,
    getTreatmentSidebar,
    getTreatmentStartDate,
} from '../constants';
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

    const getPetName = (petId) =>
        pets.find((item) => Number(item.id) === Number(petId))?.name ??
        'Mascota no encontrada';

    const getOwnerName = (petId) => {
        const pet = pets.find((item) => Number(item.id) === Number(petId));
        if (!pet) return 'No disponible';

        const owner = users.find(
            (item) => Number(item.id) === Number(pet.ownerId)
        );
        return owner
            ? `${owner.firstName} ${owner.lastName}`
            : 'No disponible';
    };

    const getVetName = (veterinarianId) => {
        const vet = users.find(
            (item) => Number(item.id) === Number(veterinarianId)
        );
        return vet
            ? `${vet.firstName} ${vet.lastName}`
            : 'No asignado';
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
            render: (row) => row.notes || '—',
        },
        {
            key: 'totalSessions',
            header: 'Sesiones',
        },
        {
            key: 'startDate',
            header: 'Inicio',
            render: (row) => formatDate(getTreatmentStartDate(row)),
        },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => {
                const status = TREATMENT_STATUS[row.status] ?? {
                    label: row.status,
                    color: 'gray',
                };

                return (
                    <Badge color={status.color}>{status.label}</Badge>
                );
            },
        },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/treatments/${row.id}`)}
                >
                    Ver detalle
                </Button>
            ),
        },
    ];

    const roleMeta = getRoleMeta(user.role);
    const sidebarItems = getTreatmentSidebar(user.role);
    const displayName = getDisplayName(user);

    return (
        <AppLayout
            sidebarItems={sidebarItems}
            userName={displayName}
            roleLabel={roleMeta.label}
            roleColor={roleMeta.color}
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
