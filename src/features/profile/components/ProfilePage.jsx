import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { changePassword, updateUser } from '@/features/users';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import Input from '@/components/Input/Input';
import PageHeader from '@/components/PageHeader/PageHeader';
import useToast from '@/components/Toast/useToast';
import './ProfilePage.css';

const SIDEBAR_BY_ROLE = {
    client: [
        { href: '/home', label: 'Inicio' },
        { href: '/pets', label: 'Mis mascotas' },
        { href: '/appointments', label: 'Mis turnos' },
        { href: '/treatments', label: 'Mis tratamientos' },
        { href: '/history', label: 'Historial clínico' },
        { href: '/payments', label: 'Mis pagos' },
        { href: '/profile', label: 'Mi perfil' },
    ],
    veterinarian: [
        { href: '/home', label: 'Inicio' },
        { href: '/schedule', label: 'Mi agenda' },
        { href: '/treatments', label: 'Tratamientos' },
        { href: '/pets', label: 'Mascotas' },
        { href: '/history', label: 'Historial clínico' },
        { href: '/profile', label: 'Mi perfil' },
    ],
    receptionist: [
        { href: '/home', label: 'Inicio' },
        { href: '/appointments', label: 'Turnos' },
        { href: '/clients', label: 'Clientes y mascotas' },
        { href: '/payments', label: 'Pagos' },
        { href: '/profile', label: 'Mi perfil' },
    ],
    admin: [
        { href: '/dashboard', label: 'Panel' },
        { href: '/users', label: 'Usuarios' },
        { href: '/appointments', label: 'Turnos' },
        { href: '/treatments', label: 'Tratamientos' },
        { href: '/history', label: 'Historial clínico' },
        { href: '/payments', label: 'Pagos y balance' },
        { href: '/profile', label: 'Mi perfil' },
    ],
};

const ROLE_INFO = {
    client: { label: 'Cliente', color: 'gray' },
    veterinarian: { label: 'Veterinario', color: 'green' },
    receptionist: { label: 'Recepción', color: 'yellow' },
    admin: { label: 'Administrador', color: 'blue' },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const EMPTY_PASSWORD_FORM = { current: '', next: '', confirm: '' };

const toDataForm = (user) => ({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
});

// RNF04: validaciones con mensajes claros
const validateData = (form) => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = 'Ingresá tu nombre.';
    if (!form.lastName.trim()) errors.lastName = 'Ingresá tu apellido.';
    if (!form.email.trim()) errors.email = 'Ingresá tu correo electrónico.';
    else if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Ingresá un correo válido, por ejemplo nombre@correo.com.';
    if (!form.phone.trim()) errors.phone = 'Ingresá un teléfono de contacto.';
    else if (!/^\d{8,15}$/.test(form.phone.replace(/[\s-]/g, ''))) errors.phone = 'El teléfono tiene que tener entre 8 y 15 números.';
    return errors;
};

const validatePassword = (form) => {
    const errors = {};
    if (!form.current) errors.current = 'Ingresá tu contraseña actual.';
    if (!form.next) errors.next = 'Ingresá la nueva contraseña.';
    else if (form.next.length < MIN_PASSWORD_LENGTH) errors.next = `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    else if (form.next === form.current) errors.next = 'La nueva contraseña tiene que ser distinta de la actual.';
    if (form.confirm !== form.next) errors.confirm = 'Las contraseñas no coinciden.';
    return errors;
};

function ProfilePage() {
    const { user, login, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [dataForm, setDataForm] = useState(() => toDataForm(user));
    const [dataErrors, setDataErrors] = useState({});
    const [savingData, setSavingData] = useState(false);

    const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [savingPassword, setSavingPassword] = useState(false);

    const role = ROLE_INFO[user.role];
    const sidebarItems = (SIDEBAR_BY_ROLE[user.role] ?? []).map((item) => ({
        ...item,
        isActive: item.href === '/profile',
    }));

    const original = toDataForm(user);
    const hasDataChanges = Object.keys(original).some(
        (key) => dataForm[key].trim() !== original[key]
    );

    const updateDataField = (field) => (e) => {
        setDataForm((current) => ({ ...current, [field]: e.target.value }));
        setDataErrors((current) => ({ ...current, [field]: '' }));
    };

    const updatePasswordField = (field) => (e) => {
        setPasswordForm((current) => ({ ...current, [field]: e.target.value }));
        setPasswordErrors((current) => ({ ...current, [field]: '' }));
    };

    const handleSaveData = async (e) => {
        e.preventDefault();
        const errors = validateData(dataForm);
        if (Object.keys(errors).length > 0) {
            setDataErrors(errors);
            return;
        }

        try {
            setSavingData(true);
            const updatedUser = await updateUser(user.id, {
                firstName: dataForm.firstName.trim(),
                lastName: dataForm.lastName.trim(),
                email: dataForm.email.trim().toLowerCase(),
                phone: dataForm.phone.trim(),
            });
            // Actualiza la sesión para que el nombre nuevo se vea en toda la app
            login(updatedUser);
            setDataForm(toDataForm(updatedUser));
            toast.success('Tus datos se guardaron.');
        } catch (err) {
            if (err.message.includes('correo')) {
                setDataErrors({ email: err.message });
            } else {
                toast.error(err.message);
            }
        } finally {
            setSavingData(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const errors = validatePassword(passwordForm);
        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }

        try {
            setSavingPassword(true);
            await changePassword(user.id, passwordForm.current, passwordForm.next);
            setPasswordForm(EMPTY_PASSWORD_FORM);
            toast.success('Tu contraseña se cambió. Usala la próxima vez que inicies sesión.');
        } catch (err) {
            if (err.message.includes('actual')) {
                setPasswordErrors({ current: err.message });
            } else {
                toast.error(err.message);
            }
        } finally {
            setSavingPassword(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const displayName =
        user.role === 'veterinarian'
            ? `Dr. ${user.firstName} ${user.lastName}`
            : `${user.firstName} ${user.lastName}`;

    return (
        <AppLayout
            sidebarItems={sidebarItems}
            userName={displayName}
            roleLabel={role.label}
            roleColor={role.color}
            onLogout={handleLogout}
        >
            <div className="profile">
                <PageHeader title="Mi perfil" subtitle="Tus datos de contacto y tu contraseña." />

                <div className="profile__grid">
                    <Card title="Datos personales">
                        <form className="profile__form" onSubmit={handleSaveData} noValidate>
                            <div className="profile__role">
                                <span className="profile__role-label">Rol</span>
                                <Badge color={role.color}>{role.label}</Badge>
                            </div>
                            <div className="profile__row">
                                <Input
                                    label="Nombre"
                                    value={dataForm.firstName}
                                    onChange={updateDataField('firstName')}
                                    error={dataErrors.firstName}
                                    required
                                />
                                <Input
                                    label="Apellido"
                                    value={dataForm.lastName}
                                    onChange={updateDataField('lastName')}
                                    error={dataErrors.lastName}
                                    required
                                />
                            </div>
                            <Input
                                label="Correo electrónico"
                                type="email"
                                value={dataForm.email}
                                onChange={updateDataField('email')}
                                error={dataErrors.email}
                                required
                            />
                            <Input
                                label="Teléfono"
                                value={dataForm.phone}
                                onChange={updateDataField('phone')}
                                error={dataErrors.phone}
                                placeholder="1155550001"
                                required
                            />
                            <div className="profile__actions">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setDataForm(original);
                                        setDataErrors({});
                                    }}
                                    disabled={!hasDataChanges || savingData}
                                >
                                    Descartar
                                </Button>
                                <Button type="submit" loading={savingData} disabled={!hasDataChanges}>
                                    Guardar cambios
                                </Button>
                            </div>
                        </form>
                    </Card>

                    <Card title="Cambiar contraseña">
                        <form className="profile__form" onSubmit={handleChangePassword} noValidate>
                            <Input
                                label="Contraseña actual"
                                type="password"
                                value={passwordForm.current}
                                onChange={updatePasswordField('current')}
                                error={passwordErrors.current}
                                required
                            />
                            <Input
                                label="Nueva contraseña"
                                type="password"
                                value={passwordForm.next}
                                onChange={updatePasswordField('next')}
                                error={passwordErrors.next}
                                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                                required
                            />
                            <Input
                                label="Repetí la nueva contraseña"
                                type="password"
                                value={passwordForm.confirm}
                                onChange={updatePasswordField('confirm')}
                                error={passwordErrors.confirm}
                                required
                            />
                            <div className="profile__actions">
                                <Button type="submit" loading={savingPassword}>
                                    Cambiar contraseña
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

export default ProfilePage;