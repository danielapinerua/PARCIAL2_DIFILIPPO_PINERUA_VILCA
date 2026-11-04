import petsMock from './mocks/pets.json';

const API_READY = import.meta.env.VITE_API_READY === 'true';
const STORAGE_KEY = 'patasana_pets';

const readMock = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : petsMock;
    } catch {
        return petsMock;
    }
};

const writeMock = (pets) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
};

/**
 * Obtiene las mascotas.
 *
 * En modo mock devuelve el JSON de `mocks/pets.json` (o lo persistido en
 * localStorage). En modo API consulta `GET /pets`.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getPets() {
    if (!API_READY) {
        return readMock();
    }

    const response = await fetch('/pets');
    if (!response.ok) {
        throw new Error('No se pudieron obtener las mascotas.');
    }
    return response.json();
}

/**
 * Crea una mascota.
 *
 * @param {object} pet Datos de la mascota.
 * @returns {Promise<object>} Mascota creada.
 */
export async function createPet(pet) {
    if (!API_READY) {
        const pets = readMock();
        const newPet = {
            ...pet,
            id: pets.reduce((max, item) => Math.max(max, item.id), 0) + 1,
        };
        writeMock([...pets, newPet]);
        return newPet;
    }

    const response = await fetch('/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pet),
    });
    if (!response.ok) {
        throw new Error('No se pudo crear la mascota.');
    }
    return response.json();
}

/**
 * Actualiza una mascota.
 *
 * @param {number} id Identificador de la mascota.
 * @param {object} changes Campos a modificar.
 * @returns {Promise<object>} Mascota actualizada.
 */
export async function updatePet(id, changes) {
    if (!API_READY) {
        const pets = readMock();
        const updated = pets.map((pet) =>
            pet.id === id ? { ...pet, ...changes, id } : pet
        );
        writeMock(updated);
        return updated.find((pet) => pet.id === id);
    }

    const response = await fetch(`/pets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    });
    if (!response.ok) {
        throw new Error('No se pudo actualizar la mascota.');
    }
    return response.json();
}

/**
 * Elimina una mascota.
 *
 * @param {number} id Identificador de la mascota.
 * @returns {Promise<void>}
 */
export async function deletePet(id) {
    if (!API_READY) {
        writeMock(readMock().filter((pet) => pet.id !== id));
        return;
    }

    const response = await fetch(`/pets/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('No se pudo eliminar la mascota.');
    }
}
