import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments, updateAppointment } from '@/features/appointments';
import { getPets } from '@/features/pets';
import { getTreatments } from '@/features/treatments';
import { getUsers } from '@/features/users';

import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import FilterBar from '@/components/FilterBar/FilterBar';
import Input from '@/components/Input/Input';
import PageHeader from '@/components/PageHeader/PageHeader';
import Select from '@/components/Select/Select';
import Spinner from '@/components/Spinner/Spinner';
import useToast from '@/components/Toast/useToast';

import './VetHistoryPage.css';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/schedule', label: 'Mi agenda' },
    { href: '/treatments', label: 'Tratamientos' },
    { href: '/pets', label: 'Mascotas' },
    { href: '/history', label: 'Historial clínico', isActive: true },
    { href: '/profile', label: 'Mi perfil' },
];

const EMPTY_FILTERS = {
    pet: '',
    from: '',
    to: '',
    treatment: '',
};

const formatDate = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

function VetHistoryPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [editingAppointmentId, setEditingAppointmentId] = useState(null);
    const [editedNotes, setEditedNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [nextAppointments, nextPets, nextTreatments, nextUsers] =
                await Promise.all([
                    getAppointments(),
                    getPets(),
                    getTreatments(),
                    getUsers(),
                ]);

            setAppointments(nextAppointments);
            setPets(nextPets);
            setTreatments(nextTreatments);
            setUsers(nextUsers);
            setLoadError('');
        } catch (err) {
            setLoadError(
                err.message || 'No se pudo cargar el historial clínico.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getPet = (petId) =>
        pets.find((pet) => Number(pet.id) === Number(petId));

    const getPetName = (petId) =>
        getPet(petId)?.name || 'Mascota no encontrada';

    const getOwnerName = (petId) => {
        const pet = getPet(petId);
        const owner = users.find(
            (item) => Number(item.id) === Number(pet?.ownerId)
        );

        return owner
            ? `${owner.firstName} ${owner.lastName}`
            : 'Propietario no disponible';
    };

    const getVetName = (vetId) => {
        const vet = users.find(
            (item) => Number(item.id) === Number(vetId)
        );

        return vet
            ? `Dr. ${vet.firstName} ${vet.lastName}`
            : 'Sin asignar';
    };

    const getTreatmentName = (treatmentId) =>
        treatments.find(
            (treatment) => Number(treatment.id) === Number(treatmentId)
        )?.name;

    const treatmentOptions = [
        { value: '', label: 'Todos' },
        { value: 'none', label: 'Consultas sin tratamiento' },
        ...treatments.map((treatment) => ({
            value: String(treatment.id),
            label: treatment.name,
        })),
    ];

    const history = useMemo(
        () =>
            appointments
                .filter(
                    (appointment) =>
                        appointment.status === 'completed' &&
                        Number(appointment.veterinarianId) ===
                            Number(user.id)
                )
                .filter(
                    (appointment) =>
                        !filters.pet ||
                        String(appointment.petId) === filters.pet
                )
                .filter(
                    (appointment) =>
                        !filters.from || appointment.date >= filters.from
                )
                .filter(
                    (appointment) =>
                        !filters.to || appointment.date <= filters.to
                )
                .filter((appointment) => {
                    if (!filters.treatment) return true;

                    if (filters.treatment === 'none') {
                        return !appointment.treatmentId;
                    }

                    return (
                        Number(appointment.treatmentId) ===
                        Number(filters.treatment)
                    );
                })
                .sort(
                    (a, b) =>
                        b.date.localeCompare(a.date) ||
                        b.time.localeCompare(a.time)
                ),
        [appointments, filters, user.id]
    );

    const updateFilter = (field) => (value) =>
        setFilters((current) => ({
            ...current,
            [field]: value,
        }));

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleEditNotes = (appointment) => {
        setEditingAppointmentId(appointment.id);
        setEditedNotes(appointment.notes || '');
    };

    const handleSaveNotes = async (appointmentId) => {
        if (savingNotes) return;

        setSavingNotes(true);

        try {
            await updateAppointment(appointmentId, {
                notes: editedNotes.trim(),
            });
            toast.success('Notas clínicas actualizadas.');
            setEditingAppointmentId(null);
            setEditedNotes('');
            await loadData();
        } catch (err) {
            toast.error(err.message || 'No se pudieron guardar las notas.');
        } finally {
            setSavingNotes(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingAppointmentId(null);
        setEditedNotes('');
    };

    const renderTimeline = () => {
        if (loading) {
            return (
                <div className="vet-history__center">
                    <Spinner label="Cargando historial…" />
                </div>
            );
        }

        if (loadError) {
            return (
                <EmptyState
                    title="No se pudo cargar el historial"
                    message={loadError}
                    action={<Button onClick={loadData}>Reintentar</Button>}
                />
            );
        }

        if (history.length === 0) {
            return (
                <EmptyState
                    title="No hay atenciones registradas"
                    message="No se encontraron atenciones que coincidan con los filtros seleccionados."
                />
            );
        }

        return (
            <ol className="vet-history-timeline">
                {history.map((appointment) => {
                    const treatmentName = appointment.treatmentId
                        ? getTreatmentName(appointment.treatmentId)
                        : null;

                    const isEditing =
                        editingAppointmentId === appointment.id;

                    const canEdit =
                        Number(appointment.veterinarianId) ===
                        Number(user.id);

                    return (
                        <li
                            key={appointment.id}
                            className="vet-history-timeline__item"
                        >
                            <div className="vet-history-timeline__header">
                                <time
                                    className="vet-history-timeline__date"
                                    dateTime={appointment.date}
                                >
                                    {formatDate(appointment.date)}
                                </time>

                                {treatmentName && (
                                    <Badge color="blue">
                                        {treatmentName}
                                    </Badge>
                                )}
                            </div>

                            <h3 className="vet-history-timeline__reason">
                                {appointment.reason}
                            </h3>

                            <p className="vet-history-timeline__info">
                                Mascota: {getPetName(appointment.petId)}
                                {' · '}
                                Propietario: {getOwnerName(appointment.petId)}
                            </p>

                            <p className="vet-history-timeline__info">
                                {getVetName(appointment.veterinarianId)}
                            </p>

                            {isEditing ? (
                                <div className="vet-history-timeline__editor">
                                    <label htmlFor={`notes-${appointment.id}`}>
                                        Observaciones clínicas
                                    </label>

                                    <textarea
                                        id={`notes-${appointment.id}`}
                                        value={editedNotes}
                                        onChange={(event) =>
                                            setEditedNotes(event.target.value)
                                        }
                                        rows={4}
                                    />

                                    <div>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                handleSaveNotes(appointment.id)
                                            }
                                            loading={savingNotes}
                                        >
                                            Guardar
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleCancelEdit}
                                            disabled={savingNotes}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="vet-history-timeline__notes">
                                        {appointment.notes ||
                                            'Sin notas registradas.'}
                                    </p>

                                    {canEdit && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                handleEditNotes(appointment)
                                            }
                                        >
                                            Editar notas
                                        </Button>
                                    )}
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        );
    };

    const renderFilters = () => (
        <FilterBar onClear={() => setFilters(EMPTY_FILTERS)}>
            <Select
                label="Mascota"
                options={[
                    { value: '', label: 'Todas las mascotas' },
                    ...pets.map((pet) => ({
                        value: String(pet.id),
                        label: pet.name,
                    })),
                ]}
                value={filters.pet}
                onChange={(event) => updateFilter('pet')(event.target.value)}
            />

            <Input
                label="Desde"
                type="date"
                value={filters.from}
                onChange={(event) =>
                    updateFilter('from')(event.target.value)
                }
            />

            <Input
                label="Hasta"
                type="date"
                value={filters.to}
                onChange={(event) =>
                    updateFilter('to')(event.target.value)
                }
            />

            <Select
                label="Tratamiento"
                options={treatmentOptions}
                value={filters.treatment}
                onChange={(event) =>
                    updateFilter('treatment')(event.target.value)
                }
            />
        </FilterBar>
    );

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Veterinario"
            roleColor="green"
            onLogout={handleLogout}
        >
            <div className="vet-history">
                <PageHeader
                    title="Historial clínico"
                    subtitle="Consultá las atenciones y observaciones clínicas de tus pacientes."
                />

                {renderFilters()}

                <Card title="Historial clínico">
                    {renderTimeline()}
                </Card>
            </div>
        </AppLayout>
    );
}

export default VetHistoryPage;
