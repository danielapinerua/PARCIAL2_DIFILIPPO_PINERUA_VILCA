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
 * Crea un tratamiento.
 *
 * En modo mock genera el id, persiste la colección en localStorage y devuelve
 * el tratamiento creado. En modo API ejecuta `POST /treatments`.
 *
 * @param {object} treatment Datos del tratamiento.
 * @returns {Promise<object>} Tratamiento creado.
 */
export async function createTreatment(treatment) {
    if (!API_READY) {
        const treatments = await getTreatments();
        const nextId =
            treatments.reduce(
                (max, item) => Math.max(max, Number(item.id) || 0),
                0
            ) + 1;
        const created = { ...treatment, id: nextId };

        writeMock([...treatments, created]);
        return created;
    }

    const response = await fetch('/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(treatment),
    });
    if (!response.ok) throw new Error('No se pudo crear el tratamiento.');
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
            Number(treatment.id) === Number(id)
                ? { ...treatment, ...changes, id: treatment.id }
                : treatment
        );
        writeMock(updated);
        return updated.find(
            (treatment) => Number(treatment.id) === Number(id)
        );
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
