import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getUsers } from '../api';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import Table from '@/components/Table/Table';

import './AdminUsersPage.css';

const SIDEBAR_ITEMS = [
    { href: '/dashboard', label: 'Panel' },
    { href: '/users', label: 'Usuarios', isActive: true },
    { href: '/appointments', label: 'Turnos' },
    { href: '/treatments', label: 'Tratamientos' },
    { href: '/history', label: 'Historial clínico' },
    { href: '/payments', label: 'Pagos y balance' },
    { href: '/profile', label: 'Mi perfil' },
];

const ROLE_LABELS = {
    client: 'Cliente',
    veterinarian: 'Veterinario',
    receptionist: 'Recepcionista',
    admin: 'Administrador',
};

function AdminUsersPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
            setLoadError('');
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const columns = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => `${row.firstName} ${row.lastName}`,
        },
        {
            key: 'email',
            header: 'Correo electrónico',
        },
        {
            key: 'phone',
            header: 'Teléfono',
        },
        {
            key: 'role',
            header: 'Rol',
            render: (row) => ROLE_LABELS[row.role] || row.role,
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

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Administrador"
            roleColor="blue"
            onLogout={handleLogout}
        >
            <div className="admin-users">
                <PageHeader
                    title="Usuarios"
                    subtitle="Consultá los usuarios registrados en PataSana."
                />

                <Card>
                    {loadError ? (
                        <EmptyState
                            title="No se pudieron cargar los usuarios"
                            message={loadError}
                            action={<Button onClick={loadUsers}>Reintentar</Button>}
                        />
                    ) : (
                        <Table
                            columns={columns}
                            data={users}
                            loading={loading}
                        />
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

export default AdminUsersPage;
