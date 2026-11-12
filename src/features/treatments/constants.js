import { daysFromToday } from '@/utils/dates';

export const TREATMENT_STATUS = {
    active: { label: 'Activo', color: 'blue' },
    completed: { label: 'Finalizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

export const APPOINTMENT_STATUS = {
    pending: { label: 'Pendiente', color: 'yellow' },
    confirmed: { label: 'Confirmado', color: 'blue' },
    completed: { label: 'Realizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

export const TREATMENT_STATUS_ORDER = {
    active: 0,
    completed: 1,
    cancelled: 2,
};

export const ROLE_META = {
    client: { label: 'Cliente', color: 'gray', prefix: '' },
    veterinarian: { label: 'Veterinario', color: 'green', prefix: 'Dr. ' },
    receptionist: { label: 'Recepción', color: 'yellow', prefix: '' },
    admin: { label: 'Administrador', color: 'blue', prefix: '' },
};

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

export const getTreatmentSidebar = (role) =>
    (SIDEBAR_BY_ROLE[role] ?? []).map((item) => ({
        ...item,
        isActive: item.href === '/treatments',
    }));

export const getRoleMeta = (role) => ROLE_META[role] ?? ROLE_META.client;

export const getDisplayName = (user) => {
    if (!user) return '';

    const meta = getRoleMeta(user.role);
    return `${meta.prefix}${user.firstName} ${user.lastName}`.trim();
};

export const formatDate = (iso) => {
    if (!iso) return '—';

    const [year, month, day] = iso.split('-');
    if (!year || !month || !day) return iso;

    return `${day}/${month}/${year}`;
};

export const formatCurrency = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) return '—';

    return `$${amount.toLocaleString('es-AR', {
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Devuelve la fecha de inicio de un tratamiento.
 *
 * Los fixtures viejos podían traer `startDateOffsetDays`; los tratamientos
 * nuevos ya se guardan con `startDate`.
 */
export const getTreatmentStartDate = (treatment) => {
    if (!treatment) return '';
    if (treatment.startDate) return treatment.startDate;
    if (Number.isFinite(treatment.startDateOffsetDays)) {
        return daysFromToday(treatment.startDateOffsetDays);
    }
    return '';
};
