import usersMock from './mocks/users.json';

const API_READY = import.meta.env.VITE_API_READY === 'true';
const STORAGE_KEY = 'patasana_users';

const readMock = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : usersMock;
    } catch {
        return usersMock;
    }
};

/**
 * Obtiene los usuarios.
 *
 * En modo mock devuelve el JSON de `mocks/users.json` (o lo persistido en
 * localStorage). En modo API consulta `GET /users`.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getUsers() {
    if (!API_READY) {
        return readMock();
    }

    const response = await fetch('/users');
    if (!response.ok) {
        throw new Error('No se pudieron obtener los usuarios.');
    }
    return response.json();
}
