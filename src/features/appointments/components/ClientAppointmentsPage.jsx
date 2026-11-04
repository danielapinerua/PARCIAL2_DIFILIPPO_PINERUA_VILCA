import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { createAppointment, getAppointments, updateAppointment } from '../api';
import { toISODate } from '@/utils/dates';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import EmptyState from '@/components/EmptyState/EmptyState';
import FilterBar from '@/components/FilterBar/FilterBar';
import Input from '@/components/Input/Input';
import Modal from '@/components/Modal/Modal';
import PageHeader from '@/components/PageHeader/PageHeader';
import Select from '@/components/Select/Select';
import Table from '@/components/Table/Table';
import Textarea from '@/components/Textarea/Textarea';
import useToast from '@/components/Toast/useToast';
import './ClientAppointmentsPage.css';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/pets', label: 'Mis mascotas' },
    { href: '/appointments', label: 'Mis turnos', isActive: true },
    { href: '/treatments', label: 'Mis tratamientos' },
    { href: '/history', label: 'Historial clínico' },
    { href: '/payments', label: 'Mis pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

const STATUS = {
    pending: { label: 'Pendiente', color: 'yellow' },
    confirmed: { label: 'Confirmado', color: 'blue' },
    completed: { label: 'Realizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

const STATUS_OPTIONS = Object.entries(STATUS).map(([value, { label }]) => ({ value, label }));

// Bloques de 30 minutos de 09:00 a 17:30
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
    const hours = String(9 + Math.floor(i / 2)).padStart(2, '0');
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hours}:${minutes}`;
});

// Importe base de una consulta pedida por el cliente.
// En turnos de tratamientos lo define el veterinario (RN07).
const DEFAULT_AMOUNT = 10000;

const EMPTY_FORM = { petId: '', veterinarianId: '', date: '', time: '', reason: '' };
const EMPTY_FILTERS = { status: '', from: '', to: '' };

const formatDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const currentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

function ClientAppointmentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [appointments, setAppointments] = useState([]);
    const [myPets, setMyPets] = useState([]);
    const [vets, setVets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [toCancel, setToCancel] = useState(null);

    const today = toISODate(new Date());

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [allAppointments, allPets, allUsers] = await Promise.all([
                getAppointments(),
                getPets(),
                getUsers(),
            ]);
            setAppointments(allAppointments);
            setMyPets(allPets.filter((p) => p.ownerId === user.id && p.active));
            setVets(allUsers.filter((u) => u.role === 'veterinarian' && u.active));
            setLoadError('');
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const myPetIds = useMemo(() => myPets.map((p) => p.id), [myPets]);

    const getPetName = (petId) => myPets.find((p) => p.id === petId)?.name ?? 'Sin datos';
    const getVetName = (vetId) => {
        const vet = vets.find((v) => v.id === vetId);
        return vet ? `Dr. ${vet.firstName} ${vet.lastName}` : 'Sin asignar';
    };

    // Turnos del cliente, filtrados y del más reciente al más viejo
    const myAppointments = useMemo(
        () =>
            appointments
                .filter((a) => myPetIds.includes(a.petId))
                .filter((a) => !filters.status || a.status === filters.status)
                .filter((a) => !filters.from || a.date >= filters.from)
                .filter((a) => !filters.to || a.date <= filters.to)
                .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
        [appointments, myPetIds, filters]
    );

    // RF11: horarios libres del veterinario elegido para la fecha elegida
    const freeSlots = useMemo(() => {
        if (!form.veterinarianId || !form.date) return [];
        const taken = appointments
            .filter(
                (a) =>
                    a.veterinarianId === Number(form.veterinarianId) &&
                    a.date === form.date &&
                    a.status !== 'cancelled'
            )
            .map((a) => a.time);
        const isToday = form.date === today;
        const now = currentTime();
        return TIME_SLOTS.filter((slot) => !taken.includes(slot) && (!isToday || slot > now));
    }, [appointments, form.veterinarianId, form.date, today]);

    const updateFilter = (field) => (e) =>
        setFilters((current) => ({ ...current, [field]: e.target.value }));

    const openRequest = () => {
        if (myPets.length === 0) {
            toast.error('Primero cargá una mascota para poder pedirle un turno.');
            return;
        }
        setForm(EMPTY_FORM);
        setErrors({});
        setFormOpen(true);
    };

    const closeRequest = () => setFormOpen(false);

    const updateField = (field) => (e) => {
        const { value } = e.target;
        setForm((current) => ({
            ...current,
            [field]: value,
            // si cambia el veterinario o la fecha, el horario elegido deja de ser válido
            ...(field === 'veterinarianId' || field === 'date' ? { time: '' } : {}),
        }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    // RN06 y RNF04: validaciones del formulario
    const validate = () => {
        const newErrors = {};
        if (!form.petId) newErrors.petId = 'Elegí la mascota.';
        if (!form.veterinarianId) newErrors.veterinarianId = 'Elegí el veterinario.';
        if (!form.date) newErrors.date = 'Elegí la fecha.';
        else if (form.date < today) newErrors.date = 'La fecha tiene que ser de hoy en adelante.';
        if (!form.time) newErrors.time = 'Elegí un horario libre.';
        if (!form.reason.trim()) newErrors.reason = 'Contanos el motivo de la consulta.';
        return newErrors;
    };

    const handleRequest = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setSaving(true);
            await createAppointment({
                petId: Number(form.petId),
                veterinarianId: Number(form.veterinarianId),
                treatmentId: null,
                date: form.date,
                time: form.time,
                reason: form.reason.trim(),
                status: 'pending',
                amount: DEFAULT_AMOUNT,
                notes: '',
            });
            toast.success('Turno solicitado. Recepción lo va a confirmar.');
            closeRequest();
            await loadData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        try {
            await updateAppointment(toCancel.id, { status: 'cancelled' });
            toast.info(`Turno de ${getPetName(toCancel.petId)} cancelado.`);
            setToCancel(null);
            await loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const canCancel = (a) =>
        (a.status === 'pending' || a.status === 'confirmed') && a.date >= today;

    const columns = [
        { key: 'date', header: 'Fecha', render: (row) => formatDate(row.date) },
        { key: 'time', header: 'Hora' },
        { key: 'pet', header: 'Mascota', render: (row) => getPetName(row.petId) },
        { key: 'vet', header: 'Veterinario', render: (row) => getVetName(row.veterinarianId) },
        { key: 'reason', header: 'Motivo' },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => (
                <Badge color={STATUS[row.status].color}>{STATUS[row.status].label}</Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (row) =>
                canCancel(row) ? (
                    <Button size="sm" variant="ghost" onClick={() => setToCancel(row)}>
                        Cancelar
                    </Button>
                ) : null,
        },
    ];

    const hasFilters = filters.status || filters.from || filters.to;

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Cliente"
            roleColor="gray"
            onLogout={handleLogout}
        >
            <div className="client-appointments">
                <PageHeader
                    title="Mis turnos"
                    subtitle="Pedí turnos para tus mascotas y seguí su estado."
                    actions={<Button onClick={openRequest}>Solicitar turno</Button>}
                />

                <FilterBar onClear={() => setFilters(EMPTY_FILTERS)}>
                    <Select
                        label="Estado"
                        options={STATUS_OPTIONS}
                        value={filters.status}
                        onChange={updateFilter('status')}
                        placeholder="Todos los estados"
                    />
                    <Input
                        label="Desde"
                        type="date"
                        value={filters.from}
                        onChange={updateFilter('from')}
                    />
                    <Input
                        label="Hasta"
                        type="date"
                        value={filters.to}
                        onChange={updateFilter('to')}
                    />
                </FilterBar>

                <Card>
                    {loadError ? (
                        <EmptyState
                            title="No se pudieron cargar tus turnos"
                            message={loadError}
                            action={<Button onClick={loadData}>Reintentar</Button>}
                        />
                    ) : !loading && myAppointments.length === 0 ? (
                        <EmptyState
                            title={hasFilters ? 'No hay turnos con esos filtros' : 'Todavía no pediste turnos'}
                            message={
                                hasFilters
                                    ? 'Probá cambiando el estado o el rango de fechas.'
                                    : 'Solicitá el primer turno para alguna de tus mascotas.'
                            }
                            action={
                                hasFilters ? (
                                    <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                                        Limpiar filtros
                                    </Button>
                                ) : (
                                    <Button onClick={openRequest}>Solicitar turno</Button>
                                )
                            }
                        />
                    ) : (
                        <Table columns={columns} data={myAppointments} loading={loading} />
                    )}
                </Card>
            </div>

            <Modal
                isOpen={formOpen}
                title="Solicitar turno"
                onClose={closeRequest}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeRequest} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleRequest} loading={saving}>
                            Solicitar turno
                        </Button>
                    </>
                }
            >
                <div className="client-appointments__form">
                    <Select
                        label="Mascota"
                        options={myPets.map((p) => ({ value: String(p.id), label: p.name }))}
                        value={form.petId}
                        onChange={updateField('petId')}
                        placeholder="Elegí una mascota"
                        error={errors.petId}
                    />
                    <Select
                        label="Veterinario"
                        options={vets.map((v) => ({
                            value: String(v.id),
                            label: `Dr. ${v.firstName} ${v.lastName}`,
                        }))}
                        value={form.veterinarianId}
                        onChange={updateField('veterinarianId')}
                        placeholder="Elegí un veterinario"
                        error={errors.veterinarianId}
                    />
                    <Input
                        label="Fecha"
                        type="date"
                        value={form.date}
                        onChange={updateField('date')}
                        error={errors.date}
                        required
                    />
                    <Select
                        label="Horario"
                        options={freeSlots.map((slot) => ({ value: slot, label: slot }))}
                        value={form.time}
                        onChange={updateField('time')}
                        placeholder={
                            form.veterinarianId && form.date
                                ? 'Elegí un horario libre'
                                : 'Primero elegí veterinario y fecha'
                        }
                        disabled={!form.veterinarianId || !form.date || freeSlots.length === 0}
                        error={errors.time}
                    />
                    {form.veterinarianId && form.date && freeSlots.length === 0 && (
                        <p className="client-appointments__no-slots">
                            No hay horarios libres ese día. Probá con otra fecha.
                        </p>
                    )}
                    <div className="client-appointments__full">
                        <Textarea
                            label="Motivo"
                            value={form.reason}
                            onChange={updateField('reason')}
                            rows={3}
                            maxLength={200}
                            error={errors.reason}
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={Boolean(toCancel)}
                title="Cancelar turno"
                message={
                    toCancel
                        ? `Se va a cancelar el turno de ${getPetName(toCancel.petId)} del ${formatDate(toCancel.date)} a las ${toCancel.time}.`
                        : ''
                }
                confirmLabel="Sí, cancelar turno"
                danger
                onConfirm={handleCancel}
                onCancel={() => setToCancel(null)}
            />
        </AppLayout>
    );
}

export default ClientAppointmentsPage;