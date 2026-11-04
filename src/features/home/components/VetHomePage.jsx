import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments, updateAppointment } from '@/features/appointments';
import { getTreatments, updateTreatment } from '@/features/treatments';
import { getPets } from '@/features/pets';
import { toISODate } from '@/utils/dates';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import Modal from '@/components/Modal/Modal';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProgressBar from '@/components/ProgressBar/ProgressBar';
import Spinner from '@/components/Spinner/Spinner';
import Table from '@/components/Table/Table';
import Textarea from '@/components/Textarea/Textarea';
import useToast from '@/components/Toast/useToast';
import './VetHomePage.css';

const STATUS = {
    pending: { label: 'Pendiente', color: 'yellow' },
    confirmed: { label: 'Confirmado', color: 'blue' },
    completed: { label: 'Realizado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
};

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio', isActive: true },
    { href: '/schedule', label: 'Mi agenda' },
    { href: '/treatments', label: 'Tratamientos' },
    { href: '/pets', label: 'Mascotas' },
    { href: '/history', label: 'Historial clínico' },
    { href: '/profile', label: 'Mi perfil' },
];

function VetHomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [appointments, setAppointments] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [attending, setAttending] = useState(null);
    const [notes, setNotes] = useState('');
    const [notesError, setNotesError] = useState('');

    useEffect(() => {
        let active = true;

        Promise.all([getAppointments(), getTreatments(), getPets()])
            .then(([appointmentsData, treatmentsData, petsData]) => {
                if (!active) return;
                setAppointments(appointmentsData);
                setTreatments(treatmentsData);
                setPets(petsData);
            })
            .catch((err) => {
                if (active) setError(err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const today = toISODate(new Date());
    const todayLabel = new Date().toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const getPetName = (petId) => pets.find((p) => p.id === petId)?.name ?? 'Sin datos';

    // Agenda del día del veterinario logueado, ordenada por horario
    const todayAppointments = useMemo(
        () =>
            appointments
                .filter((a) => a.veterinarianId === user.id && a.date === today)
                .sort((a, b) => a.time.localeCompare(b.time)),
        [appointments, user.id, today]
    );

    // Tratamientos activos a su cargo, con su progreso
    const activeTreatments = useMemo(
        () =>
            treatments
                .filter((t) => t.veterinarianId === user.id && t.status === 'active')
                .map((t) => ({
                    ...t,
                    completedSessions: appointments.filter(
                        (a) => a.treatmentId === t.id && a.status === 'completed'
                    ).length,
                })),
        [treatments, appointments, user.id]
    );

    const openAttend = (appointment) => {
        setAttending(appointment);
        setNotes('');
        setNotesError('');
    };

    const closeAttend = () => setAttending(null);

    const handleAttend = async () => {
        if (!attending) return;

        if (!notes.trim()) {
            setNotesError('Escribí las notas de la atención para poder finalizar el turno.');
            return;
        }

        const current = attending;
        setSaving(true);

        try {
            // RF12: el turno pasa a completed con sus notas
            const updatedAppointments = appointments.map((a) =>
                a.id === current.id ? { ...a, status: 'completed', notes: notes.trim() } : a
            );

            await updateAppointment(current.id, {
                status: 'completed',
                notes: notes.trim(),
            });
            setAppointments(updatedAppointments);

            // RF15: si se completaron todas las sesiones, el tratamiento finaliza
            if (current.treatmentId) {
                const treatment = treatments.find((t) => t.id === current.treatmentId);
                const completed = updatedAppointments.filter(
                    (a) => a.treatmentId === treatment.id && a.status === 'completed'
                ).length;

                if (completed >= treatment.totalSessions) {
                    await updateTreatment(treatment.id, { status: 'completed' });
                    setTreatments((currentTreatments) =>
                        currentTreatments.map((t) =>
                            t.id === treatment.id ? { ...t, status: 'completed' } : t
                        )
                    );
                    toast.success(`Tratamiento "${treatment.name}" finalizado.`);
                }
            }

            toast.success(`Turno de ${getPetName(current.petId)} atendido.`);
            closeAttend();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <AppLayout
                sidebarItems={SIDEBAR_ITEMS}
                userName={`Dr. ${user.firstName} ${user.lastName}`}
                roleLabel="Veterinario"
                roleColor="green"
                onLogout={handleLogout}
            >
                <Spinner />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout
                sidebarItems={SIDEBAR_ITEMS}
                userName={`Dr. ${user.firstName} ${user.lastName}`}
                roleLabel="Veterinario"
                roleColor="green"
                onLogout={handleLogout}
            >
                <EmptyState title="No se pudieron cargar tus datos" message={error} />
            </AppLayout>
        );
    }

    const columns = [
        { key: 'time', header: 'Hora' },
        { key: 'pet', header: 'Mascota', render: (row) => getPetName(row.petId) },
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
                row.status === 'confirmed' ? (
                    <Button size="sm" onClick={() => openAttend(row)}>
                        Atender
                    </Button>
                ) : null,
        },
    ];

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`Dr. ${user.firstName} ${user.lastName}`}
            roleLabel="Veterinario"
            roleColor="green"
            onLogout={handleLogout}
        >
            <div className="vet-home">
                <PageHeader
                    title={`Hola, ${user.firstName}`}
                    subtitle={`Tu agenda del ${todayLabel}`}
                />

                <Card title="Agenda del día">
                    {todayAppointments.length > 0 ? (
                        <Table columns={columns} data={todayAppointments} />
                    ) : (
                        <EmptyState
                            title="No tenés turnos para hoy"
                            message="Los turnos que te asignen para hoy van a aparecer acá."
                        />
                    )}
                </Card>

                <section className="vet-home__section">
                    <h2 className="vet-home__title">Tratamientos activos</h2>
                    {activeTreatments.length > 0 ? (
                        <div className="vet-home__treatments">
                            {activeTreatments.map((t) => (
                                <Card key={t.id} title={t.name}>
                                    <p className="vet-home__pet">{getPetName(t.petId)}</p>
                                    <ProgressBar
                                        value={t.completedSessions}
                                        max={t.totalSessions}
                                        label={`${t.completedSessions}/${t.totalSessions} sesiones`}
                                    />
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No tenés tratamientos activos"
                            message="Cuando crees un tratamiento lo vas a ver acá con su progreso."
                        />
                    )}
                </section>
            </div>

            <Modal
                isOpen={Boolean(attending)}
                title={attending ? `Atender a ${getPetName(attending.petId)}` : ''}
                onClose={closeAttend}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeAttend}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAttend} loading={saving}>
                            Finalizar turno
                        </Button>
                    </>
                }
            >
                {attending && (
                    <div className="vet-home__stack">
                        <p className="vet-home__pet">
                            {attending.time} · {attending.reason}
                        </p>
                        <Textarea
                            label="Notas de la atención"
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                setNotesError('');
                            }}
                            rows={5}
                            error={notesError}
                        />
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}

export default VetHomePage;
