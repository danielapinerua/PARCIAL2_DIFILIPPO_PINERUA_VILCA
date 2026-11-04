import treatmentsMock from './mocks/treatments.json';
import { hydrateDateOffset } from '@/utils/dates';

const API_READY = import.meta.env.VITE_API_READY === 'true';
const STORAGE_KEY = 'patasana_treatments';
const initialTreatments = hydrateDateOffset(
    treatmentsMock,
    'startDateOffsetDays',
    'startDate'
);

const readMock = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : initialTreatments;
    } catch {
        return initialTreatments;
    }
};

const writeMock = (treatments) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(treatments));
};

/**
 * Obtiene los tratamientos.
 *
 * En modo mock devuelve el JSON de `mocks/treatments.json` (o lo persistido
 * en localStorage). En modo API consulta `GET /treatments`.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getTreatments() {
    if (!API_READY) {
        return readMock();
    }

    const response = await fetch('/treatments');
    if (!response.ok) {
        throw new Error('No se pudieron obtener los tratamientos.');
    }
    return response.json();
}

/**
 * Actualiza un tratamiento.
 *
 * En modo mock modifica el tratamiento y persiste la colección en localStorage.
 * En modo API ejecuta `PATCH /treatments/:id`.
 *
 * @param {number} id Identificador del tratamiento.
 * @param {object} changes Campos a modificar.
 * @returns {Promise<object>} Tratamiento actualizado.
 */
export async function updateTreatment(id, changes) {
    if (!API_READY) {
        const treatments = readMock();
        const updated = treatments.map((treatment) =>
            treatment.id === id ? { ...treatment, ...changes, id } : treatment
        );
        writeMock(updated);
        return updated.find((treatment) => treatment.id === id);
    }

    const response = await fetch(`/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    });
    if (!response.ok) {
        throw new Error('No se pudo actualizar el tratamiento.');
    }
    return response.json();
}
