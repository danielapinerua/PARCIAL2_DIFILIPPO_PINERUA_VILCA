import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments } from '@/features/appointments';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { getTreatments } from '../api';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProgressBar from '@/components/ProgressBar/ProgressBar';
import Spinner from '@/components/Spinner/Spinner';
import Table from '@/components/Table/Table';
import './ClientTreatmentsPage.css';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/pets', label: 'Mis mascotas' },
    { href: '/appointments', label: 'Mis turnos' },
    { href: '/treatments', label: 'Mis tratamientos', isActive: true },
    { href: '/history', label: 'Historial clínico' },
    { href: '/payments', label: 'Mis pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

const TREATMENT_STATUS = {
    active: { label: 'Activo', color: 'blue' },
    completed: { label: 'Finalizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

const APPOINTMENT_STATUS = {
    pending: { label: 'Pendiente', color: 'yellow' },
    confirmed: { label: 'Confirmado', color: 'blue' },
    completed: { label: 'Realizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

// Orden de las tarjetas: activos, finalizados, cancelados
const STATUS_ORDER = { active: 0, completed: 1, cancelled: 2 };

const formatDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const sessionColumns = [
    { key: 'date', header: 'Fecha', render: (row) => formatDate(row.date) },
    { key: 'time', header: 'Hora' },
    { key: 'reason', header: 'Motivo' },
    {
        key: 'status',
        header: 'Estado',
        render: (row) => (
            <Badge color={APPOINTMENT_STATUS[row.status].color}>
                {APPOINTMENT_STATUS[row.status].label}
            </Badge>
        ),
    },
    { key: 'notes', header: 'Notas', render: (row) => row.notes || '—' },
];

function ClientTreatmentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [treatments, setTreatments] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [myPets, setMyPets] = useState([]);
    const [vets, setVets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [expandedIds, setExpandedIds] = useState([]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [allTreatments, allAppointments, allPets, allUsers] = await Promise.all([
                getTreatments(),
                getAppointments(),
                getPets(),
                getUsers(),
            ]);
            setTreatments(allTreatments);
            setAppointments(allAppointments);
            setMyPets(allPets.filter((p) => p.ownerId === user.id));
            setVets(allUsers.filter((u) => u.role === 'veterinarian'));
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
    const getVetName = (vetId) => {
        const vet = vets.find((v) => v.id === vetId);
        return vet ? `Dr. ${vet.firstName} ${vet.lastName}` : 'Sin asignar';
    };

    // Tratamientos de sus mascotas con sus sesiones y progreso (RF16)
    const myTreatments = useMemo(() => {
        const myPetIds = myPets.map((p) => p.id);
        return treatments
            .filter((t) => myPetIds.includes(t.petId))
            .map((t) => {
                const sessions = appointments
                    .filter((a) => a.treatmentId === t.id)
                    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
                return {
                    ...t,
                    sessions,
                    completedSessions: sessions.filter((s) => s.status === 'completed').length,
                    scheduledSessions: sessions.filter((s) => s.status !== 'cancelled').length,
                };
            })
            .sort(
                (a, b) =>
                    STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
                    b.startDate.localeCompare(a.startDate)
            );
    }, [treatments, appointments, myPets]);

    const toggleExpanded = (id) =>
        setExpandedIds((current) =>
            current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
        );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="client-treatments__center">
                    <Spinner label="Cargando tratamientos" />
                </div>
            );
        }

        if (loadError) {
            return (
                <EmptyState
                    title="No se pudieron cargar tus tratamientos"
                    message={loadError}
                    action={<Button onClick={loadData}>Reintentar</Button>}
                />
            );
        }

        if (myTreatments.length === 0) {
            return (
                <EmptyState
                    title="Tus mascotas no tienen tratamientos"
                    message="Cuando el veterinario indique un tratamiento, vas a ver acá su progreso y sus sesiones."
                />
            );
        }

        return (
            <div className="client-treatments__list">
                {myTreatments.map((t) => {
                    const isExpanded = expandedIds.includes(t.id);
                    const status = TREATMENT_STATUS[t.status];

                    return (
                        <Card key={t.id}>
                            <div className="client-treatments__header">
                                <div>
                                    <h2 className="client-treatments__name">{t.name}</h2>
                                    <p className="client-treatments__meta">
                                        {getPetName(t.petId)} · {getVetName(t.veterinarianId)} · Inicio{' '}
                                        {formatDate(t.startDate)}
                                    </p>
                                </div>
                                <Badge color={status.color}>{status.label}</Badge>
                            </div>

                            {t.notes && <p className="client-treatments__notes">{t.notes}</p>}

                            <ProgressBar
                                value={t.completedSessions}
                                max={t.totalSessions}
                                label={`${t.completedSessions}/${t.totalSessions} sesiones`}
                            />

                            <div className="client-treatments__footer">
                                <span className="client-treatments__meta">
                                    {t.scheduledSessions} de {t.totalSessions} sesiones agendadas
                                </span>
                                {t.sessions.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleExpanded(t.id)}
                                        aria-expanded={isExpanded}
                                    >
                                        {isExpanded ? 'Ocultar sesiones' : 'Ver sesiones'}
                                    </Button>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="client-treatments__sessions">
                                    <Table columns={sessionColumns} data={t.sessions} />
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Cliente"
            roleColor="gray"
            onLogout={handleLogout}
        >
            <div className="client-treatments">
                <PageHeader
                    title="Mis tratamientos"
                    subtitle="Seguí el progreso de los tratamientos de tus mascotas."
                />
                {renderContent()}
            </div>
        </AppLayout>
    );
}

export default ClientTreatmentsPage;