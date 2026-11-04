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

export async function updateUser(id, changes) {
    if (!API_READY) {
        const users = await getUsers();

        // RN02: el email es único
        const emailTaken =
            changes.email &&
            users.some(
                (u) => u.id !== id && u.email.toLowerCase() === changes.email.toLowerCase()
            );
        if (emailTaken) throw new Error('Ya existe otro usuario con ese correo electrónico.');

        const updated = users.map((u) => (u.id === id ? { ...u, ...changes } : u));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        const { password: _password, ...userWithoutPassword } = updated.find((u) => u.id === id);
        return userWithoutPassword;
    }

    const response = await fetch(`/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    });
    if (!response.ok) throw new Error('No se pudieron guardar los cambios.');
    return response.json();
}

export async function changePassword(id, currentPassword, newPassword) {
    if (!API_READY) {
        const users = await getUsers();
        const user = users.find((u) => u.id === id);
        if (!user || user.password !== currentPassword) {
            throw new Error('La contraseña actual no es correcta.');
        }
        const updated = users.map((u) => (u.id === id ? { ...u, password: newPassword } : u));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return;
    }

    const response = await fetch(`/users/${id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) throw new Error('No se pudo cambiar la contraseña.');
}