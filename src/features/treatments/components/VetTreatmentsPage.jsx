import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments } from '@/features/appointments';
import { getPets } from '@/features/pets';
import { getTreatments } from '../api';
import {
    TREATMENT_STATUS,
    TREATMENT_STATUS_ORDER,
    formatDate,
    getDisplayName,
    getRoleMeta,
    getTreatmentSidebar,
    getTreatmentStartDate,
} from '../constants';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProgressBar from '@/components/ProgressBar/ProgressBar';
import Spinner from '@/components/Spinner/Spinner';
import CreateTreatmentModal from './CreateTreatmentModal';
import './VetTreatmentsPage.css';

function VetTreatmentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [treatments, setTreatments] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [allTreatments, allAppointments, allPets] =
                await Promise.all([
                    getTreatments(),
                    getAppointments(),
                    getPets(),
                ]);

            setTreatments(allTreatments);
            setAppointments(allAppointments);
            setPets(allPets);
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
        pets.find((pet) => Number(pet.id) === Number(petId))?.name ??
        'Sin datos';

    // Tratamientos asignados al veterinario que inició sesión.
    const myTreatments = useMemo(
        () =>
            treatments
                .filter(
                    (treatment) =>
                        Number(treatment.veterinarianId) === Number(user.id)
                )
                .map((treatment) => {
                    const sessions = appointments
                        .filter(
                            (appointment) =>
                                Number(appointment.treatmentId) ===
                                Number(treatment.id)
                        )
                        .sort(
                            (a, b) =>
                                a.date.localeCompare(b.date) ||
                                a.time.localeCompare(b.time)
                        );

                    return {
                        ...treatment,
                        sessions,
                        completedSessions: sessions.filter(
                            (session) => session.status === 'completed'
                        ).length,
                        scheduledSessions: sessions.filter(
                            (session) =>
                                session.status === 'pending' ||
                                session.status === 'confirmed'
                        ).length,
                    };
                })
                .sort(
                    (a, b) =>
                        (TREATMENT_STATUS_ORDER[a.status] ?? 9) -
                            (TREATMENT_STATUS_ORDER[b.status] ?? 9) ||
                        String(getTreatmentStartDate(b)).localeCompare(
                            String(getTreatmentStartDate(a))
                        )
                ),
        [appointments, treatments, user.id]
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const roleMeta = getRoleMeta(user.role);
    const sidebarItems = getTreatmentSidebar(user.role);
    const displayName = getDisplayName(user);

    return (
        <AppLayout
            sidebarItems={sidebarItems}
            userName={displayName}
            roleLabel={roleMeta.label}
            roleColor={roleMeta.color}
            onLogout={handleLogout}
        >
            <div className="vet-treatments">
                <PageHeader
                    title="Tratamientos"
                    subtitle="Consultá y gestioná los tratamientos de tus pacientes."
                    actions={
                        <Button onClick={() => setCreateOpen(true)}>
                            Nuevo tratamiento
                        </Button>
                    }
                />

                {loading ? (
                    <div className="vet-treatments__center">
                        <Spinner label="Cargando tratamientos…" />
                    </div>
                ) : loadError ? (
                    <EmptyState
                        title="No se pudieron cargar los tratamientos"
                        message={loadError}
                        action={
                            <Button onClick={loadData}>Reintentar</Button>
                        }
                    />
                ) : myTreatments.length === 0 ? (
                    <EmptyState
                        title="No tenés tratamientos asignados"
                        message="Cuando tengas tratamientos asignados, van a aparecer acá."
                        action={
                            <Button onClick={() => setCreateOpen(true)}>
                                Nuevo tratamiento
                            </Button>
                        }
                    />
                ) : (
                    <div className="vet-treatments__list">
                        {myTreatments.map((treatment) => {
                            const status =
                                TREATMENT_STATUS[treatment.status] ?? {
                                    label: treatment.status,
                                    color: 'gray',
                                };

                            return (
                                <Card key={treatment.id}>
                                    <div className="vet-treatments__card-header">
                                        <div>
                                            <h2 className="vet-treatments__name">
                                                {treatment.name}
                                            </h2>
                                            <p className="vet-treatments__meta">
                                                Mascota:{' '}
                                                {getPetName(treatment.petId)}
                                                {' · '}
                                                Inicio:{' '}
                                                {formatDate(
                                                    getTreatmentStartDate(
                                                        treatment
                                                    )
                                                )}
                                            </p>
                                        </div>

                                        <Badge color={status.color}>
                                            {status.label}
                                        </Badge>
                                    </div>

                                    {treatment.notes && (
                                        <p className="vet-treatments__notes">
                                            {treatment.notes}
                                        </p>
                                    )}

                                    <ProgressBar
                                        value={treatment.completedSessions}
                                        max={treatment.totalSessions}
                                        label={`${treatment.completedSessions}/${treatment.totalSessions} sesiones realizadas`}
                                    />

                                    <div className="vet-treatments__footer">
                                        <span className="vet-treatments__meta">
                                            {treatment.scheduledSessions}{' '}
                                            {treatment.scheduledSessions === 1
                                                ? 'agendada'
                                                : 'agendadas'}{' '}
                                            · {treatment.totalSessions} en total
                                        </span>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                navigate(
                                                    `/treatments/${treatment.id}`
                                                )
                                            }
                                        >
                                            Ver detalle
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {createOpen && (
                <CreateTreatmentModal
                    isOpen
                    pets={pets}
                    veterinarianId={user.id}
                    onClose={() => setCreateOpen(false)}
                    onCreated={loadData}
                />
            )}
        </AppLayout>
    );
}

export default VetTreatmentsPage;
