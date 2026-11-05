import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getUsers } from '../api';
import { getPets } from '@/features/pets';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import Spinner from '@/components/Spinner/Spinner';
import Table from '@/components/Table/Table';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/schedule', label: 'Mi agenda' },
    { href: '/appointments', label: 'Turnos' },
    { href: '/clients', label: 'Clientes y mascotas', isActive: true },
    { href: '/payments', label: 'Pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

function ReceptionistClientsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [usersData, petsData] = await Promise.all([
                getUsers(),
                getPets(),
            ]);

            setUsers(usersData);
            setPets(petsData);
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

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const clients = users.filter((item) => item.role === 'client');

    const getClientPets = (clientId) => {
        return pets
            .filter((pet) => pet.ownerId === clientId)
            .map((pet) => pet.name)
            .join(', ') || 'Sin mascotas registradas';
    };

    const columns = [
        {
            key: 'name',
            header: 'Cliente',
            render: (row) => `${row.firstName} ${row.lastName}`,
        },
        {
            key: 'email',
            header: 'Correo electrónico',
        },
        {
            key: 'phone',
            header: 'Teléfono',
            render: (row) => row.phone || 'No disponible',
        },
        {
            key: 'pets',
            header: 'Mascotas',
            render: (row) => getClientPets(row.id),
        },
        {
            key: 'active',
            header: 'Estado',
            render: (row) => (
                <Badge color={row.active ? 'green' : 'gray'}>
                    {row.active ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
    ];

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
            <div className="reception-clients">
                <PageHeader
                    title="Clientes y mascotas"
                    subtitle="Consultá los clientes registrados y sus mascotas."
                />

                <Card>
                    {error ? (
                        <EmptyState
                            title="No se pudieron cargar los clientes"
                            message={error}
                            action={
                                <Button onClick={loadData}>
                                    Reintentar
                                </Button>
                            }
                        />
                    ) : clients.length > 0 ? (
                        <Table
                            columns={columns}
                            data={clients}
                        />
                    ) : (
                        <EmptyState
                            title="No hay clientes registrados"
                            message="Los clientes registrados van a aparecer acá."
                        />
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

export default ReceptionistClientsPage;
