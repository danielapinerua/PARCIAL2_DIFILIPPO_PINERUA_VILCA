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
import './ClientHistoryPage.css';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/pets', label: 'Mis mascotas' },
    { href: '/appointments', label: 'Mis turnos' },
    { href: '/treatments', label: 'Mis tratamientos' },
    { href: '/history', label: 'Historial clínico', isActive: true },
    { href: '/payments', label: 'Mis pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

const EMPTY_FILTERS = { from: '', to: '', treatment: '' };

const formatDate = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

function ClientHistoryPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [myPets, setMyPets] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [vets, setVets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [selectedPetId, setSelectedPetId] = useState('');
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [allAppointments, allPets, allTreatments, allUsers] = await Promise.all([
                getAppointments(),
                getPets(),
                getTreatments(),
                getUsers(),
            ]);
            // RF22: el cliente solo ve el historial de sus mascotas (incluidas las inactivas)
            const pets = allPets.filter((p) => p.ownerId === user.id);
            setMyPets(pets);
            setAppointments(allAppointments);
            setTreatments(allTreatments);
            setVets(allUsers.filter((u) => u.role === 'veterinarian'));
            setSelectedPetId((current) => current || (pets[0] ? String(pets[0].id) : ''));
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

    const petId = Number(selectedPetId);

    const getVetName = (vetId) => {
        const vet = vets.find((v) => v.id === vetId);
        return vet ? `Dr. ${vet.firstName} ${vet.lastName}` : 'Sin asignar';
    };
    const getTreatmentName = (id) => treatments.find((t) => t.id === id)?.name;

    // Tratamientos de la mascota elegida, para el filtro
    const petTreatments = useMemo(
        () => treatments.filter((t) => t.petId === petId),
        [treatments, petId]
    );

    const treatmentOptions = [
        { value: '', label: 'Todos' },
        { value: 'none', label: 'Consultas sin tratamiento' },
        ...petTreatments.map((t) => ({ value: String(t.id), label: t.name })),
    ];

    // Historial: turnos realizados de la mascota, del más reciente al más viejo (RF20, RF21)
    const history = useMemo(
        () =>
            appointments
                .filter((a) => a.petId === petId && a.status === 'completed')
                .filter((a) => !filters.from || a.date >= filters.from)
                .filter((a) => !filters.to || a.date <= filters.to)
                .filter((a) => {
                    if (!filters.treatment) return true;
                    if (filters.treatment === 'none') return !a.treatmentId;
                    return a.treatmentId === Number(filters.treatment);
                })
                .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
        [appointments, petId, filters]
    );

    const handlePetChange = (e) => {
        setSelectedPetId(e.target.value);
        setFilters((current) => ({ ...current, treatment: '' }));
    };

    const updateFilter = (field) => (e) =>
        setFilters((current) => ({ ...current, [field]: e.target.value }));

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const hasFilters = filters.from || filters.to || filters.treatment;
    const selectedPet = myPets.find((p) => p.id === petId);

    const renderTimeline = () => {
        if (history.length === 0) {
            return (
                <EmptyState
                    title={hasFilters ? 'No hay atenciones con esos filtros' : 'Todavía no hay atenciones registradas'}
                    message={
                        hasFilters
                            ? 'Probá con otro rango de fechas u otro tratamiento.'
                            : `Cuando ${selectedPet?.name ?? 'tu mascota'} sea atendida, las notas del veterinario van a aparecer acá.`
                    }
                    action={
                        hasFilters ? (
                            <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                                Limpiar filtros
                            </Button>
                        ) : null
                    }
                />
            );
        }

        return (
            <ol className="history-timeline">
                {history.map((a) => {
                    const treatmentName = a.treatmentId ? getTreatmentName(a.treatmentId) : null;
                    return (
                        <li key={a.id} className="history-timeline__item">
                            <div className="history-timeline__header">
                                <time className="history-timeline__date" dateTime={a.date}>
                                    {formatDate(a.date)}
                                </time>
                                {treatmentName && <Badge color="blue">{treatmentName}</Badge>}
                            </div>
                            <h3 className="history-timeline__reason">{a.reason}</h3>
                            <p className="history-timeline__vet">{getVetName(a.veterinarianId)}</p>
                            <p className="history-timeline__notes">
                                {a.notes || 'Sin notas registradas.'}
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
                <div className="client-history__center">
                    <Spinner label="Cargando historial" />
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

        if (myPets.length === 0) {
            return (
                <EmptyState
                    title="Todavía no cargaste mascotas"
                    message="Agregá una mascota para ver su historial clínico."
                    action={<Button onClick={() => navigate('/pets')}>Ir a Mis mascotas</Button>}
                />
            );
        }

        return (
            <>
                <FilterBar onClear={() => setFilters(EMPTY_FILTERS)}>
                    <Select
                        label="Mascota"
                        options={myPets.map((p) => ({
                            value: String(p.id),
                            label: p.active ? p.name : `${p.name} (inactiva)`,
                        }))}
                        value={selectedPetId}
                        onChange={handlePetChange}
                    />
                    <Input label="Desde" type="date" value={filters.from} onChange={updateFilter('from')} />
                    <Input label="Hasta" type="date" value={filters.to} onChange={updateFilter('to')} />
                    <Select
                        label="Tratamiento"
                        options={treatmentOptions}
                        value={filters.treatment}
                        onChange={updateFilter('treatment')}
                    />
                </FilterBar>

                <Card title={selectedPet ? `Historial de ${selectedPet.name}` : 'Historial'}>
                    {renderTimeline()}
                </Card>
            </>
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
            <div className="client-history">
                <PageHeader
                    title="Historial clínico"
                    subtitle="Las atenciones de tus mascotas, con las notas del veterinario."
                />
                {renderContent()}
            </div>
        </AppLayout>
    );
}

export default ClientHistoryPage;