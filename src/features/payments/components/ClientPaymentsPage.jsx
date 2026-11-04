import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments } from '@/features/appointments';
import { getPets } from '@/features/pets';
import { getPayments } from '../api';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import FilterBar from '@/components/FilterBar/FilterBar';
import PageHeader from '@/components/PageHeader/PageHeader';
import Select from '@/components/Select/Select';
import StatCard from '@/components/StatCard/StatCard';
import Table from '@/components/Table/Table';
import './ClientPaymentsPage.css';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/pets', label: 'Mis mascotas' },
    { href: '/appointments', label: 'Mis turnos' },
    { href: '/treatments', label: 'Mis tratamientos' },
    { href: '/history', label: 'Historial clínico' },
    { href: '/payments', label: 'Mis pagos', isActive: true },
    { href: '/profile', label: 'Mi perfil' },
];

// Estado de pago derivado (no se guarda): unpaid, partial, paid
const PAYMENT_STATUS = {
    unpaid: { label: 'Pendiente', color: 'red' },
    partial: { label: 'Parcial', color: 'yellow' },
    paid: { label: 'Pagado', color: 'green' },
};

const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: 'Todos' },
    ...Object.entries(PAYMENT_STATUS).map(([value, { label }]) => ({ value, label })),
];

const METHODS = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' };

const formatDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const formatMoney = (value) =>
    value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const getPaymentStatus = (paid, amount) => {
    if (paid === 0) return 'unpaid';
    if (paid < amount) return 'partial';
    return 'paid';
};

function ClientPaymentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [myPets, setMyPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [allAppointments, allPayments, allPets] = await Promise.all([
                getAppointments(),
                getPayments(),
                getPets(),
            ]);
            setAppointments(allAppointments);
            setPayments(allPayments);
            setMyPets(allPets.filter((p) => p.ownerId === user.id));
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

    const getPetName = (petId) => myPets.find((p) => p.id === petId)?.name ?? 'Sin datos';

    // RF18: turnos realizados del cliente con lo pagado y el saldo de cada uno
    const billedAppointments = useMemo(() => {
        const myPetIds = myPets.map((p) => p.id);
        return appointments
            .filter((a) => myPetIds.includes(a.petId) && a.status === 'completed')
            .map((a) => {
                const paid = payments
                    .filter((p) => p.appointmentId === a.id)
                    .reduce((sum, p) => sum + p.amount, 0);
                return {
                    ...a,
                    paid,
                    balance: a.amount - paid,
                    paymentStatus: getPaymentStatus(paid, a.amount),
                };
            })
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [appointments, payments, myPets]);

    const totals = useMemo(
        () =>
            billedAppointments.reduce(
                (acc, a) => ({
                    billed: acc.billed + a.amount,
                    paid: acc.paid + a.paid,
                    balance: acc.balance + a.balance,
                }),
                { billed: 0, paid: 0, balance: 0 }
            ),
        [billedAppointments]
    );

    const filteredAppointments = billedAppointments.filter(
        (a) => !statusFilter || a.paymentStatus === statusFilter
    );

    // Pagos realizados sobre sus turnos, del más reciente al más viejo
    const myPayments = useMemo(() => {
        const byId = Object.fromEntries(billedAppointments.map((a) => [a.id, a]));
        return payments
            .filter((p) => byId[p.appointmentId])
            .map((p) => ({ ...p, appointment: byId[p.appointmentId] }))
            .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    }, [payments, billedAppointments]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const appointmentColumns = [
        { key: 'date', header: 'Fecha', render: (row) => formatDate(row.date) },
        { key: 'pet', header: 'Mascota', render: (row) => getPetName(row.petId) },
        { key: 'reason', header: 'Motivo' },
        { key: 'amount', header: 'Importe', render: (row) => formatMoney(row.amount) },
        { key: 'paid', header: 'Pagado', render: (row) => formatMoney(row.paid) },
        {
            key: 'balance',
            header: 'Saldo',
            render: (row) => (
                <span className={row.balance > 0 ? 'client-payments__debt' : undefined}>
                    {formatMoney(row.balance)}
                </span>
            ),
        },
        {
            key: 'paymentStatus',
            header: 'Estado',
            render: (row) => (
                <Badge color={PAYMENT_STATUS[row.paymentStatus].color}>
                    {PAYMENT_STATUS[row.paymentStatus].label}
                </Badge>
            ),
        },
    ];

    const paymentColumns = [
        { key: 'date', header: 'Fecha', render: (row) => formatDate(row.date) },
        {
            key: 'appointment',
            header: 'Turno',
            render: (row) =>
                `${getPetName(row.appointment.petId)} · ${row.appointment.reason} (${formatDate(row.appointment.date)})`,
        },
        { key: 'method', header: 'Método', render: (row) => METHODS[row.method] ?? row.method },
        { key: 'amount', header: 'Importe', render: (row) => formatMoney(row.amount) },
    ];

    if (loadError) {
        return (
            <AppLayout
                sidebarItems={SIDEBAR_ITEMS}
                userName={`${user.firstName} ${user.lastName}`}
                roleLabel="Cliente"
                roleColor="gray"
                onLogout={handleLogout}
            >
                <EmptyState
                    title="No se pudieron cargar tus pagos"
                    message={loadError}
                    action={<Button onClick={loadData}>Reintentar</Button>}
                />
            </AppLayout>
        );
    }

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Cliente"
            roleColor="gray"
            onLogout={handleLogout}
        >
            <div className="client-payments">
                <PageHeader
                    title="Mis pagos"
                    subtitle="Lo facturado por las atenciones de tus mascotas y lo que ya pagaste."
                />

                <div className="client-payments__totals">
                    <StatCard label="Total facturado" value={formatMoney(totals.billed)} />
                    <StatCard label="Total pagado" value={formatMoney(totals.paid)} />
                    <StatCard label="Saldo adeudado" value={formatMoney(totals.balance)} />
                </div>

                <Card title="Atenciones realizadas">
                    <div className="client-payments__filters">
                        <FilterBar onClear={() => setStatusFilter('')}>
                            <Select
                                label="Estado de pago"
                                options={PAYMENT_STATUS_OPTIONS}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            />
                        </FilterBar>
                    </div>

                    {!loading && filteredAppointments.length === 0 ? (
                        <EmptyState
                            title={statusFilter ? 'No hay atenciones con ese estado' : 'Todavía no hay atenciones realizadas'}
                            message={
                                statusFilter
                                    ? 'Probá con otro estado de pago.'
                                    : 'Cuando tus mascotas sean atendidas, vas a ver acá el importe de cada atención.'
                            }
                        />
                    ) : (
                        <Table columns={appointmentColumns} data={filteredAppointments} loading={loading} />
                    )}
                </Card>

                <Card title="Pagos realizados">
                    {!loading && myPayments.length === 0 ? (
                        <EmptyState
                            title="Todavía no registraste pagos"
                            message="Los pagos que hagas en la veterinaria van a aparecer acá."
                        />
                    ) : (
                        <Table columns={paymentColumns} data={myPayments} loading={loading} />
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

export default ClientPaymentsPage;