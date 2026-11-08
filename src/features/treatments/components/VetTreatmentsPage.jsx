
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

import treatmentsMock from '../mocks/treatments.json';
import appointmentsMock from '@/features/appointments/mocks/appointments.json';
import petsMock from '@/features/pets/mocks/pets.json';
import usersMock from '@/features/users/mocks/users.json';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProgressBar from '@/components/ProgressBar/ProgressBar';
import Table from '@/components/Table/Table';

import './VetTreatmentsPage.css';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/schedule', label: 'Mi agenda' },
    { href: '/treatments', label: 'Tratamientos', isActive: true },
    { href: '/pets', label: 'Mascotas' },
    { href: '/history', label: 'Historial clínico' },
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

const STATUS_ORDER = { active: 0, completed: 1, cancelled: 2 };

// Convierte una cantidad de días en una fecha.
const dateFromOffset = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
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
        render: (row) => (
            <Badge color={APPOINTMENT_STATUS[row.status]?.color || 'gray'}>
                {APPOINTMENT_STATUS[row.status]?.label || row.status}
            </Badge>
        ),
    },
    { key: 'amount', header: 'Importe', render: (row) => `$${row.amount}` },
    { key: 'notes', header: 'Notas', render: (row) => row.notes || '—' },
];

function VetTreatmentsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [expandedIds, setExpandedIds] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [newTreatment, setNewTreatment] = useState({
        petId: '',
        name: '',
        notes: '',
        totalSessions: 1,
        startDate: '',
    });

    const [editingTreatmentId, setEditingTreatmentId] = useState(null);
    const [editedNotes, setEditedNotes] = useState('');

    const [schedulingTreatmentId, setSchedulingTreatmentId] = useState(null);

    const [newSession, setNewSession] = useState({
        date: '',
        time: '',
        reason: '',
        amount: '',
    });

    // Copias de los mocks para trabajar con los datos en el componente.
    const [treatments, setTreatments] = useState(() =>
        treatmentsMock.map((t) => ({
            ...t,
            startDate: dateFromOffset(t.startDateOffsetDays),
        }))
    );
    const [appointments, setAppointments] = useState(() =>
        appointmentsMock.map((a) => ({
            ...a,
            date: dateFromOffset(a.dateOffsetDays),
        }))
    );

    // Mascotas y usuarios disponibles en los mocks.
    const pets = petsMock;
    const vets = usersMock.filter((u) => u.role === 'veterinarian');

    const getPetName = (petId) =>
        pets.find((pet) => pet.id === petId)?.name ?? 'Sin datos';

    const getVetName = (vetId) => {
        const vet = vets.find((v) => v.id === vetId);
        return vet ? `Dr. ${vet.firstName} ${vet.lastName}` : 'Sin asignar';
    };

    // Tratamientos asignados al veterinario que inició sesión.
    const myTreatments = useMemo(() => {
        return treatments
            .filter((t) => t.veterinarianId === user.id)
            .map((t) => {
                const sessions = appointments
                    .filter((a) => a.treatmentId === t.id)
                    .sort(
                        (a, b) =>
                            a.date.localeCompare(b.date) ||
                            a.time.localeCompare(b.time)
                    );

                return {
                    ...t,
                    sessions,
                    completedSessions: sessions.filter(
                        (s) => s.status === 'completed'
                    ).length,
                    scheduledSessions: sessions.filter(
                        (s) => s.status !== 'cancelled'
                    ).length,
                };
            })
            .sort(
                (a, b) =>
                    STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
                    b.startDate.localeCompare(a.startDate)
            );
    }, [treatments, appointments, user.id]);

    const toggleExpanded = (id) => {
        setExpandedIds((current) =>
            current.includes(id)
                ? current.filter((x) => x !== id)
                : [...current, id]
        );
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCreateTreatment = (e) => {
        e.preventDefault();

        if (
            !newTreatment.petId ||
            !newTreatment.name.trim() ||
            !newTreatment.startDate ||
            newTreatment.totalSessions < 1
        ) {
            return;
        }

        const selectedDate = new Date(`${newTreatment.startDate}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDateOffsetDays = Math.round(
            (selectedDate - today) / (1000 * 60 * 60 * 24)
        );

        const newId = Math.max(0, ...treatments.map((t) => t.id)) + 1;

        const treatmentToAdd = {
            id: newId,
            petId: Number(newTreatment.petId),
            veterinarianId: user.id,
            name: newTreatment.name.trim(),
            notes: newTreatment.notes.trim(),
            totalSessions: Number(newTreatment.totalSessions),
            startDateOffsetDays,
            startDate: newTreatment.startDate,
            status: 'active',
        };

        setTreatments((current) => [...current, treatmentToAdd]);

        setNewTreatment({
            petId: '',
            name: '',
            notes: '',
            totalSessions: 1,
            startDate: '',
        });

        setShowCreateForm(false);
    };

    const handleSaveNotes = (treatmentId) => {
        setTreatments((current) =>
            current.map((treatment) =>
                treatment.id === treatmentId
                    ? { ...treatment, notes: editedNotes.trim() }
                    : treatment
            )
        );

        setEditingTreatmentId(null);
        setEditedNotes('');
    };

    const handleScheduleSession = (e) => {
        e.preventDefault();

        if (
            !schedulingTreatmentId ||
            !newSession.date ||
            !newSession.time ||
            !newSession.reason.trim() ||
            newSession.amount === '' ||
            Number(newSession.amount) < 0
        ) {
            return;
        }

        const treatment = treatments.find(
            (t) => t.id === schedulingTreatmentId
        );

        if (!treatment) return;

        const selectedDate = new Date(`${newSession.date}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dateOffsetDays = Math.round(
            (selectedDate - today) / (1000 * 60 * 60 * 24)
        );

        const newId = Math.max(0, ...appointments.map((a) => a.id)) + 1;

        const appointmentToAdd = {
            id: newId,
            petId: treatment.petId,
            veterinarianId: user.id,
            treatmentId: treatment.id,
            dateOffsetDays,
            date: newSession.date,
            time: newSession.time,
            reason: newSession.reason.trim(),
            status: 'pending',
            amount: Number(newSession.amount),
            notes: '',
        };

        setAppointments((current) => [...current, appointmentToAdd]);

        setNewSession({
            date: '',
            time: '',
            reason: '',
            amount: '',
        });

        setSchedulingTreatmentId(null);
    };


    const handleCancelTreatment = (treatmentId) => {
        const confirmed = window.confirm(
            '¿Estás seguro de que querés cancelar este tratamiento?'
        );

        if (!confirmed) return;

        setTreatments((current) =>
            current.map((treatment) =>
                treatment.id === treatmentId
                    ? { ...treatment, status: 'cancelled' }
                    : treatment
            )
        );

        setAppointments((current) =>
            current.map((appointment) =>
                appointment.treatmentId === treatmentId &&
                    ['pending', 'confirmed'].includes(appointment.status)
                    ? { ...appointment, status: 'cancelled' }
                    : appointment
            )
        );
    };


    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Veterinario"
            roleColor="blue"
            onLogout={handleLogout}
        >
            <div className="vet-treatments">
                <div className="vet-treatments__page-header">
                    <PageHeader
                        title="Tratamientos"
                        subtitle="Consultá y gestioná los tratamientos de tus pacientes."
                    />

                    <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                        Nuevo tratamiento
                    </Button>
                </div>

                {showCreateForm && (
                    <Card>
                        <form onSubmit={handleCreateTreatment}>
                            <h2>Nuevo tratamiento</h2>

                            <div>
                                <label htmlFor="petId">Mascota</label>
                                <select
                                    id="petId"
                                    value={newTreatment.petId}
                                    onChange={(e) =>
                                        setNewTreatment({
                                            ...newTreatment,
                                            petId: e.target.value,
                                        })
                                    }
                                    required>
                                    <option value="">Seleccioná una mascota</option>
                                    {pets.filter((pet) => pet.active)
                                        .map((pet) => (
                                            <option key={pet.id} value={pet.id}>
                                                {pet.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="treatmentName">Nombre del tratamiento</label>
                                <input
                                    id="treatmentName" type="text" value={newTreatment.name}
                                    onChange={(e) =>
                                        setNewTreatment({
                                            ...newTreatment, name: e.target.value,
                                        })
                                    } placeholder="Ej. Tratamiento dermatológico" required />
                            </div>
                            <div>
                                <label htmlFor="treatmentNotes">Observaciones</label>
                                <textarea
                                    id="treatmentNotes"
                                    value={newTreatment.notes}
                                    onChange={(e) => setNewTreatment({
                                        ...newTreatment, notes: e.target.value,
                                    })
                                    }
                                    placeholder="Indicaciones y observaciones del tratamiento"
                                />
                            </div>

                            <div>
                                <label htmlFor="totalSessions">Cantidad de sesiones</label>
                                <input
                                    id="totalSessions" type="number" min="1" value={newTreatment.totalSessions}
                                    onChange={(e) => setNewTreatment({
                                        ...newTreatment, totalSessions: e.target.value,

                                    })
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="startDate">Fecha de inicio</label>
                                <input
                                    id="startDate"
                                    type="date" value={newTreatment.startDate}
                                    onChange={(e) => setNewTreatment({
                                        ...newTreatment, startDate: e.target.value,

                                    })
                                    }
                                    required />
                            </div>

                            <Button type="submit">Guardar tratamiento</Button>

                            <Button
                                type="button" variant="ghost" onClick={() => setShowCreateForm(false)}
                            >
                                Cancelar
                            </Button>
                        </form>
                    </Card>
                )}
                {myTreatments.length === 0 ? (
                    <EmptyState
                        title="No tenés tratamientos asignados"
                        message="Cuando tengas tratamientos asignados, van a aparecer acá."
                    />
                ) : (
                    <div className="vet-treatments__list">
                        {myTreatments.map((t) => {
                            const isExpanded = expandedIds.includes(t.id);
                            const status = TREATMENT_STATUS[t.status];

                            return (
                                <Card key={t.id}>
                                    <div className="vet-treatments__header">
                                        <div>
                                            <h2>{t.name}</h2>
                                            <p>
                                                Mascota: {getPetName(t.petId)}
                                                {' · '}
                                                {getVetName(t.veterinarianId)}
                                                {' · '}
                                                Inicio: {formatDate(t.startDate)}
                                            </p>
                                        </div>

                                        <Badge color={status.color}>
                                            {status.label}
                                        </Badge>
                                    </div>

                                    {editingTreatmentId === t.id ? (
                                        <div>
                                            <label htmlFor={`notes-${t.id}`}>Observaciones</label>

                                            <textarea
                                                id={`notes-${t.id}`}
                                                value={editedNotes}
                                                onChange={(e) => setEditedNotes(e.target.value)}
                                                rows={3}
                                            />

                                            <Button
                                                size="sm"
                                                onClick={() => handleSaveNotes(t.id)}
                                            >
                                                Guardar cambios
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditingTreatmentId(null);
                                                    setEditedNotes('');
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p>{t.notes || 'Sin observaciones.'}</p>

                                            {t.status === 'active' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingTreatmentId(t.id);
                                                        setEditedNotes(t.notes || '');
                                                    }}
                                                >
                                                    Editar observaciones
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    <ProgressBar
                                        value={t.completedSessions}
                                        max={t.totalSessions}
                                        label={`${t.completedSessions}/${t.totalSessions} sesiones realizadas`}
                                    />

                                    <p>
                                        {t.scheduledSessions} de {t.totalSessions} sesiones agendadas
                                    </p>

                                    <div>
                                        {t.sessions.length > 0 && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => toggleExpanded(t.id)}
                                            >
                                                {isExpanded ? 'Ocultar sesiones' : 'Ver sesiones'}
                                            </Button>
                                        )}

                                        {t.status === 'active' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setSchedulingTreatmentId(t.id)}
                                                >
                                                    Agendar sesión
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleCancelTreatment(t.id)}
                                                >
                                                    Cancelar tratamiento
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div>
                                            <Table
                                                columns={sessionColumns}
                                                data={t.sessions}
                                            />
                                        </div>
                                    )}

                                    {schedulingTreatmentId === t.id && (
                                        <Card>
                                            <form onSubmit={handleScheduleSession}>
                                                <h3>Agendar sesión: {t.name}</h3>

                                                <div>
                                                    <label htmlFor={`session-date-${t.id}`}>
                                                        Fecha
                                                    </label>
                                                    <input
                                                        id={`session-date-${t.id}`}
                                                        type="date"
                                                        value={newSession.date}
                                                        min={new Date().toLocaleDateString('en-CA')}
                                                        onChange={(e) =>
                                                            setNewSession({
                                                                ...newSession,
                                                                date: e.target.value,
                                                            })
                                                        }
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor={`session-time-${t.id}`}>
                                                        Hora
                                                    </label>
                                                    <input
                                                        id={`session-time-${t.id}`}
                                                        type="time"
                                                        value={newSession.time}
                                                        onChange={(e) =>
                                                            setNewSession({
                                                                ...newSession,
                                                                time: e.target.value,
                                                            })
                                                        }
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor={`session-reason-${t.id}`}>
                                                        Motivo
                                                    </label>
                                                    <input
                                                        id={`session-reason-${t.id}`}
                                                        type="text"
                                                        value={newSession.reason}
                                                        onChange={(e) =>
                                                            setNewSession({
                                                                ...newSession,
                                                                reason: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Ej. Sesión 1 de rehabilitación"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor={`session-amount-${t.id}`}>
                                                        Importe ($)
                                                    </label>
                                                    <input
                                                        id={`session-amount-${t.id}`}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={newSession.amount}
                                                        onChange={(e) =>
                                                            setNewSession({
                                                                ...newSession,
                                                                amount: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Ej. 15000"
                                                        required
                                                    />
                                                </div>

                                                <Button type="submit">
                                                    Guardar sesión
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSchedulingTreatmentId(null);
                                                        setNewSession({
                                                            date: '',
                                                            time: '',
                                                            reason: '',
                                                            amount: '',
                                                        });
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                            </form>
                                        </Card>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default VetTreatmentsPage;
