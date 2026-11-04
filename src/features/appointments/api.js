import appointmentsMock from './mocks/appointments.json';
import { hydrateDateOffset } from '@/utils/dates';

const API_READY = import.meta.env.VITE_API_READY === 'true';
const STORAGE_KEY = 'patasana_appointments';
const initialAppointments = hydrateDateOffset(
    appointmentsMock,
    'dateOffsetDays',
    'date'
);

const readMock = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : initialAppointments;
    } catch {
        return initialAppointments;
    }
};

const writeMock = (appointments) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
};

/**
 * Obtiene los turnos.
 *
 * En modo mock devuelve el JSON de `mocks/appointments.json` (o lo persistido
 * en localStorage). En modo API consulta `GET /appointments`.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getAppointments() {
    if (!API_READY) {
        return readMock();
    }

    const response = await fetch('/appointments');
    if (!response.ok) {
        throw new Error('No se pudieron obtener los turnos.');
    }
    return response.json();
}

/**
 * Actualiza un turno.
 *
 * En modo mock modifica el turno y persiste la colección en localStorage.
 * En modo API ejecuta `PATCH /appointments/:id`.
 *
 * @param {number} id Identificador del turno.
 * @param {object} changes Campos a modificar.
 * @returns {Promise<object>} Turno actualizado.
 */
export async function updateAppointment(id, changes) {
    if (!API_READY) {
        const appointments = readMock();
        const updated = appointments.map((appointment) =>
            appointment.id === id
                ? { ...appointment, ...changes, id }
                : appointment
        );
        writeMock(updated);
        return updated.find((appointment) => appointment.id === id);
    }

    const response = await fetch(`/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    });
    if (!response.ok) {
        throw new Error('No se pudo actualizar el turno.');
    }
    return response.json();
}

export async function createAppointment(appointment) {
    if (!API_READY) {
        const appointments = await getAppointments();
        const nextId = appointments.reduce((max, a) => Math.max(max, a.id), 0) + 1;
        const created = { ...appointment, id: nextId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...appointments, created]));
        return created;
    }

    const response = await fetch('/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
    });
    if (!response.ok) throw new Error('No se pudo solicitar el turno.');
    return response.json();
}