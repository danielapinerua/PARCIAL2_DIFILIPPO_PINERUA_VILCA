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

const writeMock = (users) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const withoutPassword = (user) => {
    const { password: _password, ...rest } = user;
    return rest;
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

/**
 * Crea un usuario.
 *
 * En modo mock valida el email único, genera el id y persiste la colección en
 * localStorage. En modo API ejecuta `POST /users`.
 *
 * @param {object} user Datos del usuario.
 * @returns {Promise<object>} Usuario creado, sin contraseña.
 */
export async function createUser(user) {
    if (!API_READY) {
        const users = readMock();
        const email = normalizeEmail(user.email);

        if (users.some((item) => normalizeEmail(item.email) === email)) {
            throw new Error('Ya existe otro usuario con ese correo electrónico.');
        }

        const nextId =
            users.reduce(
                (max, item) => Math.max(max, Number(item.id) || 0),
                0
            ) + 1;
        const created = {
            ...user,
            id: nextId,
            email,
            active: user.active !== false,
        };

        writeMock([...users, created]);
        return withoutPassword(created);
    }

    const response = await fetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    if (!response.ok) {
        throw new Error('No se pudo crear el usuario.');
    }
    return response.json();
}

/**
 * Actualiza un usuario.
 *
 * En modo mock valida el email único y persiste los cambios en localStorage.
 * En modo API ejecuta `PATCH /users/:id`.
 *
 * @param {number} id Identificador del usuario.
 * @param {object} changes Campos a modificar.
 * @returns {Promise<object>} Usuario actualizado, sin contraseña.
 */
export async function updateUser(id, changes) {
    if (!API_READY) {
        const users = await getUsers();
        const email = changes.email
            ? normalizeEmail(changes.email)
            : undefined;

        // RN02: el email es único
        const emailTaken =
            email &&
            users.some(
                (item) =>
                    Number(item.id) !== Number(id) &&
                    normalizeEmail(item.email) === email
            );
        if (emailTaken) {
            throw new Error('Ya existe otro usuario con ese correo electrónico.');
        }

        const updated = users.map((item) =>
            Number(item.id) === Number(id)
                ? {
                      ...item,
                      ...changes,
                      ...(email ? { email } : {}),
                      id: item.id,
                  }
                : item
        );
        writeMock(updated);

        const user = updated.find(
            (item) => Number(item.id) === Number(id)
        );
        return withoutPassword(user);
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
        const user = users.find((item) => Number(item.id) === Number(id));
        if (!user || user.password !== currentPassword) {
            throw new Error('La contraseña actual no es correcta.');
        }
        const updated = users.map((item) =>
            Number(item.id) === Number(id)
                ? { ...item, password: newPassword }
                : item
        );
        writeMock(updated);
        return;
    }

    const response = await fetch(`/users/${id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) throw new Error('No se pudo cambiar la contraseña.');
}
