import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments } from '@/features/appointments';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
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
import './ClientTreatmentsPage.css';

function ClientTreatmentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [treatments, setTreatments] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [myPets, setMyPets] = useState([]);
    const [vets, setVets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [allTreatments, allAppointments, allPets, allUsers] =
                await Promise.all([
                    getTreatments(),
                    getAppointments(),
                    getPets(),
                    getUsers(),
                ]);

            setTreatments(allTreatments);
            setAppointments(allAppointments);
            setMyPets(
                allPets.filter(
                    (pet) => Number(pet.ownerId) === Number(user.id)
                )
            );
            setVets(
                allUsers.filter((item) => item.role === 'veterinarian')
            );
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

    const getPetName = (petId) =>
        myPets.find((pet) => Number(pet.id) === Number(petId))?.name ??
        'Sin datos';

    const getVetName = (vetId) => {
        const vet = vets.find((item) => Number(item.id) === Number(vetId));
        return vet
            ? `Dr. ${vet.firstName} ${vet.lastName}`
            : 'Sin asignar';
    };

    // Tratamientos de sus mascotas con sus sesiones y progreso.
    const myTreatments = useMemo(() => {
        const myPetIds = myPets.map((pet) => Number(pet.id));

        return treatments
            .filter((treatment) =>
                myPetIds.includes(Number(treatment.petId))
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
            );
    }, [treatments, appointments, myPets]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const roleMeta = getRoleMeta(user.role);
    const sidebarItems = getTreatmentSidebar(user.role);
    const displayName = getDisplayName(user);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="client-treatments__center">
                    <Spinner label="Cargando tratamientos…" />
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
                {myTreatments.map((treatment) => {
                    const status = TREATMENT_STATUS[treatment.status] ?? {
                        label: treatment.status,
                        color: 'gray',
                    };

                    return (
                        <Card key={treatment.id}>
                            <div className="client-treatments__header">
                                <div>
                                    <h2 className="client-treatments__name">
                                        {treatment.name}
                                    </h2>
                                    <p className="client-treatments__meta">
                                        {getPetName(treatment.petId)} ·{' '}
                                        {getVetName(treatment.veterinarianId)}{' '}
                                        · Inicio{' '}
                                        {formatDate(
                                            getTreatmentStartDate(treatment)
                                        )}
                                    </p>
                                </div>
                                <Badge color={status.color}>
                                    {status.label}
                                </Badge>
                            </div>

                            {treatment.notes && (
                                <p className="client-treatments__notes">
                                    {treatment.notes}
                                </p>
                            )}

                            <ProgressBar
                                value={treatment.completedSessions}
                                max={treatment.totalSessions}
                                label={`${treatment.completedSessions}/${treatment.totalSessions} sesiones`}
                            />

                            <div className="client-treatments__footer">
                                <span className="client-treatments__meta">
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
                                        navigate(`/treatments/${treatment.id}`)
                                    }
                                >
                                    Ver detalle
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <AppLayout
            sidebarItems={sidebarItems}
            userName={displayName}
            roleLabel={roleMeta.label}
            roleColor={roleMeta.color}
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
