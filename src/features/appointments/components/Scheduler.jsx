import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar, { useCalendarController } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import classicTheme from '@fullcalendar/react/themes/classic';
import esLocale from '@fullcalendar/react/locales/es';
import { useAuth } from '@/features/auth';
import { getPets } from '@/features/pets';
import { getUsers } from '@/features/users';
import { getAppointments } from '../api';
import { toISODate } from '@/utils/dates';
import AppLayout from '@/components/AppLayout/AppLayout';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import EmptyState from '@/components/EmptyState/EmptyState';
import Input from '@/components/Input/Input';
import PageHeader from '@/components/PageHeader/PageHeader';
import Select from '@/components/Select/Select';
import Spinner from '@/components/Spinner/Spinner';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';
import './Scheduler.css';

const STATUS = {
    pending: { label: 'Pendiente', initial: 'P', tone: 'warning' },
    confirmed: { label: 'Confirmado', initial: 'C', tone: 'info' },
    completed: { label: 'Realizado', initial: 'R', tone: 'success' },
    cancelled: { label: 'Cancelado', initial: 'X', tone: 'danger' },
};

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

const VIEW_OPTIONS = [
    { id: 'timeGridDay', label: 'Día' },
    { id: 'timeGridWeek', label: 'Semana' },
    { id: 'dayGridMonth', label: 'Mes' },
];

const VET_SIDEBAR = [
    { href: '/home', label: 'Inicio' },
    { href: '/schedule', label: 'Mi agenda', isActive: true },
    { href: '/treatments', label: 'Tratamientos' },
    { href: '/pets', label: 'Mascotas' },
    { href: '/history', label: 'Historial clínico' },
    { href: '/profile', label: 'Mi perfil' },
];

const RECEPTION_SIDEBAR = [
    { href: '/home', label: 'Inicio' },
    { href: '/schedule', label: 'Mi agenda', isActive: true },
    { href: '/appointments', label: 'Turnos' },
    { href: '/clients', label: 'Clientes y mascotas' },
    { href: '/payments', label: 'Pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

const SLOT_MINUTES = 30;

const MONTH_LONG = new Intl.DateTimeFormat('es', { month: 'long' });
const MONTH_SHORT = new Intl.DateTimeFormat('es', { month: 'short' });

const buildRangeTitle = (view) => {
    if (!view) return '';

    const start = view.currentStart;
    const end = new Date(view.currentEnd.getTime() - 1);

    if (view.type === 'timeGridDay') {
        return new Intl.DateTimeFormat('es', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(start);
    }

    if (view.type === 'dayGridMonth') {
        return `${MONTH_LONG.format(start)} de ${start.getFullYear()}`;
    }

    const sameMonth =
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear();

    if (sameMonth) {
        return `${start.getDate()} – ${end.getDate()} de ${MONTH_LONG.format(
            start
        )} de ${start.getFullYear()}`;
    }

    if (start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()} ${MONTH_SHORT.format(
            start
        )} – ${end.getDate()} ${MONTH_SHORT.format(end)} de ${start.getFullYear()}`;
    }

    return `${start.getDate()} ${MONTH_SHORT.format(start)} ${start.getFullYear()} – ${end.getDate()} ${MONTH_SHORT.format(end)} ${end.getFullYear()}`;
};

const getInitialView = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches
        ? 'timeGridDay'
        : 'timeGridWeek';

const pad = (value) => String(value).padStart(2, '0');

const toLocalISO = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

const buildEvent = (appointment, petById, userById) => {
    if (!appointment?.date || !appointment?.time) return null;

    const start = new Date(`${appointment.date}T${appointment.time}:00`);
    if (Number.isNaN(start.getTime())) return null;

    const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
    const pet = petById.get(appointment.petId);
    const owner = pet ? userById.get(pet.ownerId) : undefined;
    const status = STATUS[appointment.status] ? appointment.status : 'pending';

    const petLine = [
        pet?.name ?? 'Mascota',
        SPECIES[pet?.species] ?? 'Especie sin datos',
        SEX[pet?.sex] ?? 'Sexo sin datos',
    ].join(' · ');

    const ownerName = owner
        ? `${owner.firstName} ${owner.lastName}`.trim()
        : 'Sin propietario';

    const reason = appointment.reason?.trim() || 'Sin motivo registrado';

    return {
        id: String(appointment.id),
        title: petLine,
        start: toLocalISO(start),
        end: toLocalISO(end),
        allDay: false,
        className: `scheduler-event scheduler-event--${status}`,
        extendedProps: {
            status,
            petLine,
            ownerName,
            reason,
            tooltip: `${petLine}\n${ownerName}\n${reason}`,
        },
    };
};

/**
 * Contenido personalizado de cada turno.
 *
 * En Día/Semana se muestran las tres líneas pedidas y la inicial del estado
 * arriba a la derecha. En Mes se usa una fila compacta con tooltip.
 */
function renderEventContent(info) {
    const { status, petLine, ownerName, reason, tooltip } =
        info.event.extendedProps;
    const meta = STATUS[status] ?? STATUS.pending;

    if (info.view.type === 'dayGridMonth') {
        return (
            <span className="scheduler-event__month" title={tooltip}>
                <span
                    className={`scheduler-event__dot scheduler-event__dot--${status}`}
                    aria-hidden="true"
                />
                <span className="scheduler-event__month-pet">{petLine}</span>
                <span className="scheduler-event__month-initial">
                    {meta.initial}
                </span>
                <span className="sr-only">{meta.label}</span>
            </span>
        );
    }

    return (
        <div className="scheduler-event__body" title={tooltip}>
            <span className="scheduler-event__status" aria-hidden="true">
                {meta.initial}
            </span>
            <span className="scheduler-event__line scheduler-event__line--pet">
                {petLine}
            </span>
            <span className="scheduler-event__line">{ownerName}</span>
            <span className="scheduler-event__line scheduler-event__line--reason">
                {reason}
            </span>
            <span className="sr-only">{meta.label}</span>
        </div>
    );
}

function Scheduler() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const controller = useCalendarController();

    const isVeterinarian = user?.role === 'veterinarian';
    const isReceptionist = user?.role === 'receptionist';

    const [initialView] = useState(getInitialView);
    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [vetFilter, setVetFilter] = useState('all');
    const [calendarState, setCalendarState] = useState({
        title: '',
        viewType: initialView,
        start: null,
        end: null,
    });
    const [periodOpen, setPeriodOpen] = useState(false);
    const [periodDate, setPeriodDate] = useState(() => toISODate(new Date()));
    const periodRef = useRef(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError('');

        try {
            const [nextAppointments, nextPets, nextUsers] = await Promise.all([
                getAppointments(),
                getPets(),
                getUsers(),
            ]);

            setAppointments(nextAppointments);
            setPets(nextPets);
            setUsers(nextUsers);
        } catch {
            setLoadError('No se pudo cargar la agenda. Intentá nuevamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!periodOpen) return undefined;

        const handlePointerDown = (event) => {
            if (periodRef.current && !periodRef.current.contains(event.target)) {
                setPeriodOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setPeriodOpen(false);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [periodOpen]);

    const petById = useMemo(
        () => new Map(pets.map((pet) => [pet.id, pet])),
        [pets]
    );

    const userById = useMemo(
        () => new Map(users.map((item) => [item.id, item])),
        [users]
    );

    const vetOptions = useMemo(() => {
        const options = [
            { value: 'all', label: 'Todos los veterinarios' },
        ];

        users
            .filter(
                (item) =>
                    item.role === 'veterinarian' && item.active !== false
            )
            .forEach((item) => {
                options.push({
                    value: String(item.id),
                    label: `Dr. ${item.firstName} ${item.lastName}`,
                });
            });

        return options;
    }, [users]);

    const filteredAppointments = useMemo(() => {
        if (!user) return [];

        if (isReceptionist) {
            if (vetFilter === 'all') return appointments;

            return appointments.filter(
                (appointment) =>
                    Number(appointment.veterinarianId) === Number(vetFilter)
            );
        }

        if (isVeterinarian) {
            return appointments.filter(
                (appointment) =>
                    Number(appointment.veterinarianId) ===
                    Number(user.id)
            );
        }

        return [];
    }, [appointments, isReceptionist, isVeterinarian, user, vetFilter]);

    const events = useMemo(
        () =>
            filteredAppointments
                .map((appointment) => buildEvent(appointment, petById, userById))
                .filter(Boolean),
        [filteredAppointments, petById, userById]
    );

    const visibleEvents = useMemo(() => {
        const { start, end } = calendarState;
        if (!start || !end) return events;

        return events.filter((event) => {
            const time = new Date(event.start).getTime();
            return time >= start.getTime() && time < end.getTime();
        });
    }, [calendarState, events]);

    const handleDatesSet = useCallback((info) => {
        setCalendarState({
            title: buildRangeTitle(info.view),
            viewType: info.view.type,
            start: info.start,
            end: info.end,
        });
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const goToPeriod = () => {
        if (periodDate) controller.gotoDate(periodDate);
        setPeriodOpen(false);
    };

    const displayName = user
        ? `${isVeterinarian ? 'Dr. ' : ''}${user.firstName} ${user.lastName}`
        : '';

    const roleLabel = isVeterinarian ? 'Veterinario' : 'Recepción';
    const roleColor = isVeterinarian ? 'green' : 'yellow';
    const sidebarItems = isVeterinarian ? VET_SIDEBAR : RECEPTION_SIDEBAR;
    const showEmptyNotice = !loading && !loadError && visibleEvents.length === 0;

    return (
        <AppLayout
            sidebarItems={sidebarItems}
            userName={displayName}
            roleLabel={roleLabel}
            roleColor={roleColor}
            onLogout={handleLogout}
        >
            <div className="scheduler">
                <PageHeader
                    title="Agenda"
                    subtitle={
                        isVeterinarian
                            ? 'Consultá y organizá tus turnos.'
                            : 'Consultá los turnos de todos los veterinarios.'
                    }
                />

                <div className="scheduler-card">
                    <Card>
                        {loading ? (
                            <div className="scheduler__loading">
                                <Spinner label="Cargando agenda…" />
                            </div>
                        ) : loadError ? (
                            <EmptyState
                                title="No se pudo cargar la agenda"
                                message={loadError}
                                action={
                                    <Button onClick={loadData}>
                                        Reintentar
                                    </Button>
                                }
                            />
                        ) : (
                            <>
                                <div className="scheduler__toolbar">
                                    <div className="scheduler__nav">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => controller.prev()}
                                            aria-label="Período anterior"
                                        >
                                            ‹
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => controller.next()}
                                            aria-label="Período siguiente"
                                        >
                                            ›
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => controller.today()}
                                        >
                                            Hoy
                                        </Button>
                                    </div>

                                    <h2
                                        className="scheduler__range"
                                        aria-live="polite"
                                    >
                                        {calendarState.title}
                                    </h2>

                                    <div className="scheduler__controls">
                                        <div
                                            className="scheduler__views"
                                            role="group"
                                            aria-label="Vista"
                                        >
                                            {VIEW_OPTIONS.map((view) => (
                                                <Button
                                                    key={view.id}
                                                    variant={
                                                        calendarState.viewType ===
                                                        view.id
                                                            ? 'primary'
                                                            : 'ghost'
                                                    }
                                                    size="sm"
                                                    aria-pressed={
                                                        calendarState.viewType ===
                                                        view.id
                                                    }
                                                    onClick={() =>
                                                        controller.changeView(
                                                            view.id
                                                        )
                                                    }
                                                >
                                                    {view.label}
                                                </Button>
                                            ))}
                                        </div>

                                        <div
                                            className="scheduler__period"
                                            ref={periodRef}
                                        >
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                aria-expanded={periodOpen}
                                                aria-controls="scheduler-period-panel"
                                                onClick={() =>
                                                    setPeriodOpen(
                                                        (open) => !open
                                                    )
                                                }
                                            >
                                                Periodo
                                            </Button>

                                            {periodOpen && (
                                                <div
                                                    className="scheduler__period-panel"
                                                    id="scheduler-period-panel"
                                                    role="dialog"
                                                    aria-label="Ir a una fecha"
                                                >
                                                    <Input
                                                        label="Fecha"
                                                        type="date"
                                                        value={periodDate}
                                                        onChange={(event) =>
                                                            setPeriodDate(
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={goToPeriod}
                                                        disabled={!periodDate}
                                                    >
                                                        Ir
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="scheduler__meta">
                                    {isReceptionist && (
                                        <div className="scheduler__filter">
                                            <Select
                                                label="Veterinario"
                                                options={vetOptions}
                                                value={vetFilter}
                                                onChange={(event) =>
                                                    setVetFilter(
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    <ul
                                        className="scheduler__legend"
                                        aria-label="Estados de los turnos"
                                    >
                                        {Object.entries(STATUS).map(
                                            ([key, meta]) => (
                                                <li
                                                    key={key}
                                                    className="scheduler__legend-item"
                                                >
                                                    <span
                                                        className={`scheduler__legend-dot scheduler__legend-dot--${key}`}
                                                        aria-hidden="true"
                                                    />
                                                    {meta.label}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>

                                {showEmptyNotice && (
                                    <p
                                        className="scheduler__notice"
                                        role="status"
                                    >
                                        No hay turnos en este período.
                                    </p>
                                )}

                                <div className="scheduler__calendar">
                                    <FullCalendar
                                        controller={controller}
                                        plugins={[
                                            classicTheme,
                                            dayGridPlugin,
                                            timeGridPlugin,
                                        ]}
                                        locale={esLocale}
                                        initialView={initialView}
                                        headerToolbar={false}
                                        height="100%"
                                        expandRows
                                        firstDay={1}
                                        weekends
                                        allDaySlot
                                        allDayText="Todo el día"
                                        slotMinTime="09:00:00"
                                        slotMaxTime="18:00:00"
                                        slotDuration="00:30:00"
                                        slotHeaderInterval="01:00"
                                        slotMinHeight={52}
                                        scrollTime="09:00:00"
                                        nowIndicator
                                        timeZone="local"
                                        dayMaxEvents={2}
                                        moreLinkText={(count) =>
                                            `+${count} más`
                                        }
                                        slotHeaderFormat={{
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false,
                                            omitZeroMinute: false,
                                        }}
                                        slotHeaderClass="scheduler-slot-header"
                                        slotHeaderInnerClass="scheduler-slot-header__inner"
                                        events={events}
                                        datesSet={handleDatesSet}
                                        eventContent={renderEventContent}
                                        blockEventInnerClass="scheduler-event__inner scheduler-event__inner--block"
                                        listItemEventInnerClass="scheduler-event__inner scheduler-event__inner--list"
                                    />
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

export default Scheduler;
