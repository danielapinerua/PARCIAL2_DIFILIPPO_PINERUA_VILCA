import { useCallback, useEffect, useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments, updateAppointment } from '@/features/appointments';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { getTreatments, updateTreatment } from '../api';
import {
    APPOINTMENT_STATUS,
    TREATMENT_STATUS,
    formatCurrency,
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
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import EmptyState from '@/components/EmptyState/EmptyState';
import Modal from '@/components/Modal/Modal';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProgressBar from '@/components/ProgressBar/ProgressBar';
import Spinner from '@/components/Spinner/Spinner';
import Table from '@/components/Table/Table';
import Textarea from '@/components/Textarea/Textarea';
import useToast from '@/components/Toast/useToast';
import ScheduleSessionModal from './ScheduleSessionModal';
import './TreatmentDetailPage.css';

const SPECIES = {
    dog: 'Perro',
    cat: 'Gato',
    bird: 'Ave',
    rodent: 'Roedor',
    other: 'Otro',
};

const SEX = {
    male: 'Macho',
    female: 'Hembra',
};

const sessionColumns = [
    {
        key: 'date',
        header: 'Fecha',
        render: (row) => formatDate(row.date),
    },
    { key: 'time', header: 'Hora' },
    { key: 'reason', header: 'Motivo' },
    {
        key: 'status',
        header: 'Estado',
        render: (row) => {
            const status = APPOINTMENT_STATUS[row.status] ?? {
                label: row.status,
                color: 'gray',
            };

            return <Badge color={status.color}>{status.label}</Badge>;
        },
    },
    {
        key: 'amount',
        header: 'Importe',
        render: (row) => formatCurrency(row.amount),
    },
    {
        key: 'notes',
        header: 'Notas',
        render: (row) => row.notes || '—',
    },
];

function TreatmentDetailPage() {
    const { treatmentId } = useParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const notesFormId = useId();

    const [treatment, setTreatment] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [pet, setPet] = useState(null);
    const [owner, setOwner] = useState(null);
    const [vet, setVet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [forbidden, setForbidden] = useState(false);

    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        setNotFound(false);
        setForbidden(false);

        try {
            const [allTreatments, allAppointments, allPets, allUsers] =
                await Promise.all([
                    getTreatments(),
                    getAppointments(),
                    getPets(),
                    getUsers(),
                ]);

            const foundTreatment = allTreatments.find(
                (item) => Number(item.id) === Number(treatmentId)
            );

            if (!foundTreatment) {
                setTreatment(null);
                setSessions([]);
                setNotFound(true);
                return;
            }

            const foundPet =
                allPets.find(
                    (item) => Number(item.id) === Number(foundTreatment.petId)
                ) ?? null;

            if (
                user.role === 'veterinarian' &&
                Number(foundTreatment.veterinarianId) !== Number(user.id)
            ) {
                setTreatment(null);
                setSessions([]);
                setForbidden(true);
                return;
            }

            if (
                user.role === 'client' &&
                (!foundPet || Number(foundPet.ownerId) !== Number(user.id))
            ) {
                setTreatment(null);
                setSessions([]);
                setForbidden(true);
                return;
            }

            const foundOwner = foundPet
                ? allUsers.find(
                      (item) => Number(item.id) === Number(foundPet.ownerId)
                  ) ?? null
                : null;

            const foundVet =
                allUsers.find(
                    (item) =>
                        Number(item.id) ===
                        Number(foundTreatment.veterinarianId)
                ) ?? null;

            const foundSessions = allAppointments
                .filter(
                    (appointment) =>
                        Number(appointment.treatmentId) ===
                        Number(foundTreatment.id)
                )
                .sort(
                    (a, b) =>
                        a.date.localeCompare(b.date) ||
                        a.time.localeCompare(b.time)
                );

            setTreatment(foundTreatment);
            setSessions(foundSessions);
            setAppointments(allAppointments);
            setPet(foundPet);
            setOwner(foundOwner);
            setVet(foundVet);
        } catch (err) {
            setLoadError(
                err.message || 'No se pudo cargar el tratamiento.'
            );
        } finally {
            setLoading(false);
        }
    }, [treatmentId, user.id, user.role]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCancelTreatment = async () => {
        if (!treatment || cancelling) return;

        setCancelling(true);

        try {
            const sessionsToCancel = sessions.filter(
                (session) =>
                    session.status === 'pending' ||
                    session.status === 'confirmed'
            );

            await Promise.all(
                sessionsToCancel.map((session) =>
                    updateAppointment(session.id, { status: 'cancelled' })
                )
            );
            await updateTreatment(treatment.id, { status: 'cancelled' });

            toast.success('Tratamiento cancelado.');
            setCancelOpen(false);
            await loadData();
        } catch (err) {
            toast.error(
                err.message || 'No se pudo cancelar el tratamiento.'
            );
        } finally {
            setCancelling(false);
        }
    };

    const openNotes = () => {
        setNotes(treatment?.notes ?? '');
        setNotesOpen(true);
    };

    const handleSaveNotes = async (event) => {
        event.preventDefault();

        if (!treatment || savingNotes) return;

        setSavingNotes(true);

        try {
            await updateTreatment(treatment.id, { notes: notes.trim() });
            toast.success('Observaciones actualizadas.');
            setNotesOpen(false);
            await loadData();
        } catch (err) {
            toast.error(
                err.message || 'No se pudieron guardar las observaciones.'
            );
        } finally {
            setSavingNotes(false);
        }
    };

    const roleMeta = getRoleMeta(user.role);
    const sidebarItems = getTreatmentSidebar(user.role);
    const displayName = getDisplayName(user);

    const completedSessions = sessions.filter(
        (session) => session.status === 'completed'
    ).length;
    const scheduledSessions = sessions.filter(
        (session) =>
            session.status === 'pending' || session.status === 'confirmed'
    ).length;
    const totalSessions = treatment?.totalSessions ?? 0;
    const allScheduled =
        totalSessions > 0 &&
        completedSessions + scheduledSessions >= totalSessions;
    const canManage = Boolean(
        treatment &&
            treatment.status === 'active' &&
            (user.role === 'admin' ||
                (user.role === 'veterinarian' &&
                    Number(treatment.veterinarianId) === Number(user.id)))
    );
    const canSchedule = canManage && totalSessions > 0 && !allScheduled;
    const nextSessionNumber = completedSessions + scheduledSessions + 1;
    const scheduleDisabledReason =
        totalSessions === 0
            ? 'El tratamiento no tiene sesiones configuradas.'
            : 'Ya no quedan sesiones por agendar en este tratamiento.';
    const closeNotes = savingNotes ? () => {} : () => setNotesOpen(false);

    const status = treatment
        ? TREATMENT_STATUS[treatment.status] ?? {
              label: treatment.status,
              color: 'gray',
          }
        : null;

    let managementNotice = null;

    if (user.role !== 'client' && treatment) {
        if (treatment.status !== 'active') {
            managementNotice = `Este tratamiento está ${status.label.toLowerCase()}. No se pueden agendar ni cancelar sesiones.`;
        } else if (canManage && allScheduled) {
            managementNotice =
                'Ya no quedan sesiones por agendar en este tratamiento.';
        } else if (canManage && totalSessions === 0) {
            managementNotice =
                'El tratamiento no tiene sesiones configuradas.';
        }
    }

    const petLine = pet
        ? `${pet.name} · ${SPECIES[pet.species] ?? 'Especie sin datos'} · ${
              SEX[pet.sex] ?? 'Sexo sin datos'
          }`
        : 'Mascota sin datos';

    const ownerName = owner
        ? `${owner.firstName} ${owner.lastName}`.trim()
        : 'Sin datos';

    const vetName = vet
        ? `${vet.role === 'veterinarian' ? 'Dr. ' : ''}${vet.firstName} ${
              vet.lastName
          }`.trim()
        : 'Sin asignar';

    const sessionsToCancel = sessions.filter(
        (session) =>
            session.status === 'pending' || session.status === 'confirmed'
    ).length;

    const cancelMessage = !treatment
        ? ''
        : sessionsToCancel > 0
          ? `Se va a cancelar "${treatment.name}" y ${
                sessionsToCancel === 1
                    ? 'su sesión pendiente o confirmada'
                    : `sus ${sessionsToCancel} sesiones pendientes o confirmadas`
            }. Esta acción no se puede deshacer.`
          : `Se va a cancelar "${treatment.name}". Esta acción no se puede deshacer.`;

    const backLabel =
        user.role === 'client'
            ? '← Volver a mis tratamientos'
            : '← Volver a tratamientos';

    const renderContent = () => {
        if (loading) {
            return (
                <div className="treatment-detail__center">
                    <Spinner label="Cargando tratamiento…" />
                </div>
            );
        }

        if (loadError) {
            return (
                <EmptyState
                    title="No se pudo cargar el tratamiento"
                    message={loadError}
                    action={<Button onClick={loadData}>Reintentar</Button>}
                />
            );
        }

        if (notFound) {
            return (
                <EmptyState
                    title="Tratamiento no encontrado"
                    message="No encontramos el tratamiento que buscás."
                    action={
                        <Button onClick={() => navigate('/treatments')}>
                            Volver a tratamientos
                        </Button>
                    }
                />
            );
        }

        if (forbidden) {
            return (
                <EmptyState
                    title="No tenés acceso a este tratamiento"
                    message="El tratamiento no pertenece a tu cuenta."
                    action={
                        <Button onClick={() => navigate('/treatments')}>
                            Volver a tratamientos
                        </Button>
                    }
                />
            );
        }

        if (!treatment) return null;

        return (
            <>
                <PageHeader
                    title={treatment.name}
                    subtitle={`${petLine} · ${ownerName}`}
                    actions={
                        canManage ? (
                            <>
                                <Button
                                    onClick={() => setScheduleOpen(true)}
                                    disabled={!canSchedule}
                                    title={
                                        !canSchedule
                                            ? scheduleDisabledReason
                                            : undefined
                                    }
                                >
                                    Agendar sesión
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => setCancelOpen(true)}
                                >
                                    Cancelar tratamiento
                                </Button>
                            </>
                        ) : undefined
                    }
                />

                <Card title="Información general">
                    <dl className="treatment-detail__grid">
                        <div className="treatment-detail__item">
                            <dt className="treatment-detail__label">
                                Estado
                            </dt>
                            <dd className="treatment-detail__value">
                                <Badge color={status.color}>
                                    {status.label}
                                </Badge>
                            </dd>
                        </div>

                        <div className="treatment-detail__item">
                            <dt className="treatment-detail__label">
                                Inicio
                            </dt>
                            <dd className="treatment-detail__value">
                                {formatDate(
                                    getTreatmentStartDate(treatment)
                                )}
                            </dd>
                        </div>

                        <div className="treatment-detail__item">
                            <dt className="treatment-detail__label">
                                Mascota
                            </dt>
                            <dd className="treatment-detail__value">
                                {petLine}
                            </dd>
                        </div>

                        <div className="treatment-detail__item">
                            <dt className="treatment-detail__label">
                                Dueño
                            </dt>
                            <dd className="treatment-detail__value">
                                {ownerName}
                            </dd>
                        </div>

                        <div className="treatment-detail__item">
                            <dt className="treatment-detail__label">
                                Veterinario
                            </dt>
                            <dd className="treatment-detail__value">
                                {vetName}
                            </dd>
                        </div>

                        <div className="treatment-detail__item">
                            <dt className="treatment-detail__label">
                                Sesiones
                            </dt>
                            <dd className="treatment-detail__value">
                                {completedSessions}{' '}
                                {completedSessions === 1
                                    ? 'realizada'
                                    : 'realizadas'}{' '}
                                · {scheduledSessions}{' '}
                                {scheduledSessions === 1
                                    ? 'agendada'
                                    : 'agendadas'}{' '}
                                · {totalSessions} totales
                            </dd>
                        </div>
                    </dl>

                    <div className="treatment-detail__progress">
                        <ProgressBar
                            value={completedSessions}
                            max={totalSessions}
                            label={`${completedSessions} de ${totalSessions} sesiones realizadas`}
                        />
                    </div>

                    {managementNotice && (
                        <p className="treatment-detail__notice">
                            {managementNotice}
                        </p>
                    )}

                    <div className="treatment-detail__notes">
                        <div className="treatment-detail__notes-header">
                            <h3 className="treatment-detail__notes-title">
                                Observaciones
                            </h3>
                            {canManage && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={openNotes}
                                >
                                    Editar
                                </Button>
                            )}
                        </div>
                        <p className="treatment-detail__notes-text">
                            {treatment.notes?.trim() ||
                                'Sin observaciones.'}
                        </p>
                    </div>
                </Card>

                <Card title="Sesiones">
                    <p className="treatment-detail__sessions-meta">
                        {sessions.length}{' '}
                        {sessions.length === 1
                            ? 'sesión registrada'
                            : 'sesiones registradas'}
                    </p>

                    <Table
                        columns={sessionColumns}
                        data={sessions}
                        emptyMessage="Todavía no hay sesiones agendadas para este tratamiento."
                    />
                </Card>
            </>
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
            <div className="treatment-detail">
                <div className="treatment-detail__back">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/treatments')}
                    >
                        {backLabel}
                    </Button>
                </div>

                {renderContent()}
            </div>

            {scheduleOpen && treatment && (
                <ScheduleSessionModal
                    isOpen
                    treatment={treatment}
                    petName={pet?.name}
                    nextSessionNumber={nextSessionNumber}
                    appointments={appointments}
                    onClose={() => setScheduleOpen(false)}
                    onScheduled={loadData}
                />
            )}

            {notesOpen && treatment && (
                <Modal
                    isOpen
                    title="Editar observaciones"
                    onClose={closeNotes}
                    footer={
                        <>
                            <Button
                                variant="secondary"
                                onClick={closeNotes}
                                disabled={savingNotes}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                form={notesFormId}
                                loading={savingNotes}
                            >
                                Guardar cambios
                            </Button>
                        </>
                    }
                >
                    <form id={notesFormId} onSubmit={handleSaveNotes} noValidate>
                        <Textarea
                            label="Observaciones"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={5}
                            maxLength={500}
                            data-autofocus
                        />
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                isOpen={cancelOpen}
                title="Cancelar tratamiento"
                message={cancelMessage}
                confirmLabel="Sí, cancelar tratamiento"
                danger
                loading={cancelling}
                onConfirm={handleCancelTreatment}
                onCancel={() => setCancelOpen(false)}
            />
        </AppLayout>
    );
}

export default TreatmentDetailPage;
