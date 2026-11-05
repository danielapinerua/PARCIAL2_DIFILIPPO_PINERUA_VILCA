import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getPets } from '../api';
import { getUsers } from '@/features/users';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import Table from '@/components/Table/Table';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/schedule', label: 'Mi agenda' },
    { href: '/treatments', label: 'Tratamientos' },
    { href: '/pets', label: 'Mascotas', isActive: true },
    { href: '/history', label: 'Historial clínico' },
    { href: '/profile', label: 'Mi perfil' },
];

const SPECIES = {
    dog: 'Perro',
    cat: 'Gato',
    bird: 'Ave',
    rodent: 'Roedor',
    other: 'Otro',
};

const SEX = {
    male: 'Macho',
    female: 'Hembra',
};

const getAge = (birthDate) => {
    if (!birthDate) return '—';

    const birth = new Date(birthDate);
    const now = new Date();

    let months =
        (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth());

    if (now.getDate() < birth.getDate()) months -= 1;

    if (months < 12) return `${Math.max(months, 0)} meses`;

    const years = Math.floor(months / 12);
    return years === 1 ? '1 año' : `${years} años`;
};

function VetPetsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [pets, setPets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [allPets, allUsers] = await Promise.all([
                getPets(),
                getUsers(),
            ]);

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

    const getOwnerName = (ownerId) => {
        const owner = users.find((u) => u.id === ownerId);

        return owner
            ? `${owner.firstName} ${owner.lastName}`
            : 'Dueño no encontrado';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const columns = [
        {
            key: 'name',
            header: 'Mascota',
            render: (row) => (
                <strong>
                    {row.name}
                    {!row.active && (
                        <Badge color="gray">Inactiva</Badge>
                    )}
                </strong>
            ),
        },
        {
            key: 'species',
            header: 'Especie',
            render: (row) => SPECIES[row.species] || '—',
        },
        {
            key: 'breed',
            header: 'Raza',
            render: (row) => row.breed || '—',
        },
        {
            key: 'sex',
            header: 'Sexo',
            render: (row) => SEX[row.sex] || '—',
        },
        {
            key: 'age',
            header: 'Edad',
            render: (row) => getAge(row.birthDate),
        },
        {
            key: 'weight',
            header: 'Peso',
            render: (row) => `${row.weight} kg`,
        },
        {
            key: 'owner',
            header: 'Dueño',
            render: (row) => getOwnerName(row.ownerId),
        },
    ];

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Veterinario"
            roleColor="blue"
            onLogout={handleLogout}
        >
            <div>
                <PageHeader
                    title="Mascotas"
                    subtitle="Consultá los datos de las mascotas y sus respectivos dueños."
                />

                <Card>
                    {loadError ? (
                        <EmptyState
                            title="No se pudieron cargar las mascotas"
                            message={loadError}
                            action={
                                <Button onClick={loadData}>
                                    Reintentar
                                </Button>
                            }
                        />
                    ) : !loading && pets.length === 0 ? (
                        <EmptyState
                            title="No hay mascotas registradas"
                            message="Todavía no hay mascotas para consultar."
                        />
                    ) : (
                        <Table
                            columns={columns}
                            data={pets}
                            loading={loading}
                        />
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

export default VetPetsPage;
