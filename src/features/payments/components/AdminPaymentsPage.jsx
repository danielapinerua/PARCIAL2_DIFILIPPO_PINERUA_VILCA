import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments } from '@/features/appointments';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { getPayments } from '../api';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatCard from '@/components/StatCard/StatCard';
import Table from '@/components/Table/Table';
import Spinner from '@/components/Spinner/Spinner';

import './AdminPaymentsPage.css';

const SIDEBAR_ITEMS = [
    { href: '/dashboard', label: 'Panel' },
    { href: '/users', label: 'Usuarios' },
    { href: '/appointments', label: 'Turnos' },
    { href: '/treatments', label: 'Tratamientos' },
    { href: '/history', label: 'Historial clínico' },
    { href: '/payments', label: 'Pagos y balance', isActive: true },
    { href: '/profile', label: 'Mi perfil' },
];

const PAYMENT_STATUS = {
    unpaid: { label: 'Pendiente', color: 'red' },
    partial: { label: 'Parcial', color: 'yellow' },
    paid: { label: 'Pagado', color: 'green' },
};

const METHODS = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
};

const formatDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const formatMoney = (value) =>
    value.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
    });

const getPaymentStatus = (paid, amount) => {
    if (paid === 0) return 'unpaid';
    if (paid < amount) return 'partial';
    return 'paid';
};

function AdminPaymentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [pets, setPets] = useState([]);
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [allAppointments, allPayments, allPets, allUsers] =
                await Promise.all([
                    getAppointments(),
                    getPayments(),
                    getPets(),
                    getUsers(),
                ]);

            setAppointments(allAppointments);
            setPayments(allPayments);
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

    const getPetName = (petId) =>
        pets.find((pet) => pet.id === petId)?.name ?? 'Sin datos';

    const getOwnerName = (petId) => {
        const pet = pets.find((p) => p.id === petId);
        const owner = users.find((u) => u.id === pet?.ownerId);

        return owner
            ? `${owner.firstName} ${owner.lastName}`
            : 'Sin datos';
    };

    // Calculamos cuánto se pagó por cada turno completado.
    const billedAppointments = useMemo(() => {
        return appointments
            .filter((a) => a.status === 'completed')
            .map((appointment) => {
                const paid = payments
                    .filter((p) => p.appointmentId === appointment.id)
                    .reduce((sum, payment) => sum + payment.amount, 0);

                return {
                    ...appointment,
                    paid,
                    balance: appointment.amount - paid,
                    paymentStatus: getPaymentStatus(
                        paid,
                        appointment.amount
                    ),
                };
            })
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [appointments, payments]);

    // Calculamos los totales generales.
    const totals = useMemo(
        () =>
            billedAppointments.reduce(
                (acc, appointment) => ({
                    billed: acc.billed + appointment.amount,
                    paid: acc.paid + appointment.paid,
                    balance: acc.balance + appointment.balance,
                }),
                { billed: 0, paid: 0, balance: 0 }
            ),
        [billedAppointments]
    );

    // Relacionamos cada pago con su turno.
    const allPayments = useMemo(() => {
        const appointmentsById = Object.fromEntries(
            billedAppointments.map((a) => [a.id, a])
        );

        return payments
            .filter((p) => appointmentsById[p.appointmentId])
            .map((payment) => ({
                ...payment,
                appointment: appointmentsById[payment.appointmentId],
            }))
            .sort(
                (a, b) =>
                    b.date.localeCompare(a.date) || b.id - a.id
            );
    }, [payments, billedAppointments]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Administrador"
            roleColor="blue"
            onLogout={handleLogout}
        >
            <div className="admin-payments">
                <PageHeader
                    title="Pagos y balance"
                    subtitle="Consultá la facturación, los pagos y los saldos pendientes de todas las mascotas."
                />

                {loading ? (
                    <div className="admin-payments__center">
                        <Spinner label="Cargando pagos" />
                    </div>
                ) : loadError ? (
                    <EmptyState
                        title="No se pudieron cargar los pagos"
                        message={loadError}
                        action={<Button onClick={loadData}>Reintentar</Button>}
                    />
                ) : (
                    <>
                        <div className="admin-payments__totals">
                            <StatCard
                                label="Total facturado"
                                value={formatMoney(totals.billed)}
                            />
                            <StatCard
                                label="Total pagado"
                                value={formatMoney(totals.paid)}
                            />
                            <StatCard
                                label="Saldo adeudado"
                                value={formatMoney(totals.balance)}
                            />
                        </div>
                        
    <Card title="Atenciones realizadas">
        <Table
        columns={[
            {
                key: 'date',
                header: 'Fecha',
                render: (row) => formatDate(row.date),
            },
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
                key: 'reason',
                header: 'Motivo',
            },
            {
                key: 'amount',
                header: 'Importe',
                render: (row) => formatMoney(row.amount),
            },
            {
                key: 'paid',
                header: 'Pagado',
                render: (row) => formatMoney(row.paid),
            },
            {
                key: 'balance',
                header: 'Saldo',
                render: (row) => formatMoney(row.balance),
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
        ]}
        data={billedAppointments}
        />
        </Card>
        
        <Card title="Pagos registrados">
            <Table
            columns={[
            {
                key: 'date',
                header: 'Fecha',
                render: (row) => formatDate(row.date),
            },
            {
                key: 'appointment',
                header: 'Turno',
                render: (row) =>
                    `#${row.appointment.id} · ${getPetName(row.appointment.petId)} · ${row.appointment.reason}`,
            },
            {
                key: 'owner',
                header: 'Propietario',
                render: (row) =>
                    getOwnerName(row.appointment.petId),
            },
            {
                key: 'method',
                header: 'Método',
                render: (row) => METHODS[row.method] ?? row.method,
            },
            {
                key: 'amount',
                header: 'Importe',
                render: (row) => formatMoney(row.amount),
            },
        ]}
        data={allPayments}
        />
        </Card>
        </>
    )}
    </div>
    </AppLayout>
    );
}

export default AdminPaymentsPage;