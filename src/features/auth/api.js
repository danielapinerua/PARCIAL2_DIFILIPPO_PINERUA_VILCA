import { getUsers } from '@/features/users/api';

const API_READY = import.meta.env.VITE_API_READY === 'true';

/**
 * Inicia sesión.
 *
 * En modo mock valida las credenciales contra `users.json` / localStorage.
 * En modo API ejecuta `POST /auth/login`.
 *
 * @param {string} email Correo electrónico.
 * @param {string} password Contraseña.
 * @returns {Promise<object>} Usuario autenticado, sin contraseña.
 */
export async function login(email, password) {
    if (!API_READY) {
        const normalizedEmail = email.trim().toLowerCase();
        const users = await getUsers();
        const user = users.find(
            (item) =>
                item.email.toLowerCase() === normalizedEmail &&
                item.password === password
        );

        if (!user) {
            throw new Error('El correo electrónico o la contraseña son incorrectos.');
        }

        if (!user.active) {
            throw new Error('Tu cuenta está desactivada. Contactá a la veterinaria.');
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    const user = await response.json();
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
