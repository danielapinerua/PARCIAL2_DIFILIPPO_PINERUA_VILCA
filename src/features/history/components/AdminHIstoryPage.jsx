
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments } from '@/features/appointments';
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

import './AdminHistoryPage.css';

const SIDEBAR_ITEMS = [
    { href: '/dashboard', label: 'Panel' },
    { href: '/users', label: 'Usuarios' },
    { href: '/appointments', label: 'Turnos' },
    { href: '/treatments', label: 'Tratamientos' },
    { href: '/history', label: 'Historial clínico', isActive: true },
    { href: '/payments', label: 'Pagos y balance' },
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

function AdminHistoryPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [allAppointments, allPets, allTreatments, allUsers] =
                await Promise.all([
                    getAppointments(),
                    getPets(),
                    getTreatments(),
                    getUsers(),
                ]);

            setAppointments(allAppointments);
            setPets(allPets);
            setTreatments(allTreatments);
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

    const getPet = (petId) =>
        pets.find((pet) => pet.id === petId);

    const getPetName = (petId) =>
        getPet(petId)?.name || 'Mascota no encontrada';

    const getOwnerName = (petId) => {
        const pet = getPet(petId);
        const owner = users.find((u) => u.id === pet?.ownerId);

        return owner
            ? `${owner.firstName} ${owner.lastName}`
            : 'Propietario no disponible';
    };

    const getVetName = (vetId) => {
        const vet = users.find((u) => u.id === vetId);

        return vet
            ? `Dr. ${vet.firstName} ${vet.lastName}`
            : 'Sin asignar';
    };

    const getTreatmentName = (treatmentId) =>
        treatments.find((t) => t.id === treatmentId)?.name;

    const treatmentOptions = [
        { value: '', label: 'Todos' },
        { value: 'none', label: 'Consultas sin tratamiento' },
        ...treatments.map((t) => ({
            value: String(t.id),
            label: t.name,
        })),
    ];

    const history = useMemo(
        () =>
            appointments
                .filter((a) => a.status === 'completed')
                .filter((a) => !filters.pet || String(a.petId) === filters.pet)
                .filter((a) => !filters.from || a.date >= filters.from)
                .filter((a) => !filters.to || a.date <= filters.to)
                .filter((a) => {
                    if (!filters.treatment) return true;
                    if (filters.treatment === 'none') return !a.treatmentId;
                    return a.treatmentId === Number(filters.treatment);
                })
                .sort(
                    (a, b) =>
                        b.date.localeCompare(a.date) ||
                        b.time.localeCompare(a.time)
                ),
        [appointments, filters]
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

    const renderTimeline = () => {
        if (history.length === 0) {
            return (
                <EmptyState
                    title="No hay atenciones registradas"
                    message="Cuando se completen turnos, las atenciones aparecerán en esta sección."
                />
            );
        }

        return (
            <ol className="history-timeline">
                {history.map((appointment) => {
                    const treatmentName = appointment.treatmentId
                        ? getTreatmentName(appointment.treatmentId)
                        : null;

                    return (
                        <li key={appointment.id} className="history-timeline__item">
                            <div className="history-timeline__header">
                                <time
                                    className="history-timeline__date"
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

                            <h3 className="history-timeline__reason">
                                {appointment.reason}
                            </h3>

                            <p className="history-timeline__vet">
                                Mascota: {getPetName(appointment.petId)}
                                {' · '}
                                Propietario: {getOwnerName(appointment.petId)}
                            </p>

                            <p className="history-timeline__vet">
                                {getVetName(appointment.veterinarianId)}
                            </p>

                            <p className="history-timeline__notes">
                                {appointment.notes || 'Sin notas registradas.'}
                            </p>
                        </li>
                    );
                })}
            </ol>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="admin-history__center">
                    <Spinner label="Cargando historiales" />
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

        return (
            <>
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
                        onChange={updateFilter('pet')}
                    />

                    <Input
                        label="Desde"
                        type="date"
                        value={filters.from}
                        onChange={(e) => updateFilter('from')(e.target.value)}
                    />

                    <Input
                        label="Hasta"
                        type="date"
                        value={filters.to}
                        onChange={(e) => updateFilter('to')(e.target.value)}
                    />

                    <Select
                        label="Tratamiento"
                        options={treatmentOptions}
                        value={filters.treatment}
                        onChange={updateFilter('treatment')}
                    />
                </FilterBar>

                <Card title="Historiales clínicos">
                    {renderTimeline()}
                </Card>
            </>
        );
    };

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Administrador"
            roleColor="blue"
            onLogout={handleLogout}
        >
            <div className="admin-history">
                <PageHeader
                    title="Historial clínico"
                    subtitle="Consultá las atenciones y notas médicas de todas las mascotas."
                />

                {renderContent()}
            </div>
        </AppLayout>
    );
}

export default AdminHistoryPage;
