import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getUsers, updateUser } from '../api';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import Table from '@/components/Table/Table';
import useToast from '@/components/Toast/useToast';
import UserFormModal from './UserFormModal';

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
    const { user, login, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [toDeactivate, setToDeactivate] = useState(null);
    const [saving, setSaving] = useState(false);

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

    const openCreate = () => {
        setEditingUser(null);
        setFormOpen(true);
    };

    const openEdit = (selectedUser) => {
        setEditingUser(selectedUser);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingUser(null);
    };

    const handleSaved = async (savedUser) => {
        await loadUsers();

        if (savedUser && Number(savedUser.id) === Number(user.id)) {
            login(savedUser);
        }
    };

    const handleActivate = async (selectedUser) => {
        try {
            await updateUser(selectedUser.id, { active: true });
            toast.success('Usuario activado.');
            await loadUsers();
        } catch (err) {
            toast.error(err.message || 'No se pudo activar el usuario.');
        }
    };

    const handleDeactivate = async () => {
        if (!toDeactivate) return;

        setSaving(true);

        try {
            await updateUser(toDeactivate.id, { active: false });
            toast.success('Usuario desactivado.');
            setToDeactivate(null);
            await loadUsers();
        } catch (err) {
            toast.error(err.message || 'No se pudo desactivar el usuario.');
        } finally {
            setSaving(false);
        }
    };

    const activeAdmins = users.filter(
        (item) => item.role === 'admin' && item.active
    ).length;

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
        {
            key: 'actions',
            header: '',
            render: (row) => {
                const isSelf = Number(row.id) === Number(user.id);
                const isLastAdmin =
                    row.role === 'admin' &&
                    row.active &&
                    activeAdmins <= 1;
                const cannotDeactivate = isSelf || isLastAdmin;

                return (
                    <div className="admin-users__actions">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(row)}
                        >
                            Editar
                        </Button>

                        {row.active ? (
                            <Button
                                size="sm"
                                variant="danger"
                                disabled={cannotDeactivate}
                                title={
                                    isSelf
                                        ? 'No podés desactivar tu propia cuenta.'
                                        : isLastAdmin
                                          ? 'No podés desactivar al último administrador activo.'
                                          : undefined
                                }
                                onClick={() => setToDeactivate(row)}
                            >
                                Desactivar
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleActivate(row)}
                            >
                                Activar
                            </Button>
                        )}
                    </div>
                );
            },
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
                    subtitle="Gestioná altas, datos y estado de los usuarios de PataSana."
                    actions={
                        <Button onClick={openCreate}>Nuevo usuario</Button>
                    }
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

            {formOpen && (
                <UserFormModal
                    isOpen
                    user={editingUser}
                    isSelf={Number(editingUser?.id) === Number(user.id)}
                    onClose={closeForm}
                    onSaved={handleSaved}
                />
            )}

            <ConfirmDialog
                isOpen={Boolean(toDeactivate)}
                title="Desactivar usuario"
                message={
                    toDeactivate
                        ? `Se va a desactivar a ${toDeactivate.firstName} ${toDeactivate.lastName}. No va a poder iniciar sesión hasta que lo actives nuevamente.`
                        : ''
                }
                confirmLabel="Sí, desactivar"
                danger
                loading={saving}
                onConfirm={handleDeactivate}
                onCancel={() => setToDeactivate(null)}
            />
        </AppLayout>
    );
}

export default AdminUsersPage;
