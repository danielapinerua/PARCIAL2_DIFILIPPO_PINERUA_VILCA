import { toISODate } from '@/utils/dates';

// Bloques de 30 minutos de 09:00 a 17:30.
export const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
    const hours = String(9 + Math.floor(i / 2)).padStart(2, '0');
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hours}:${minutes}`;
});

// Importe base de una consulta pedida por el cliente.
// En turnos de tratamientos lo define el veterinario.
export const DEFAULT_AMOUNT = 10000;

export const currentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
    ).padStart(2, '0')}`;
};

/**
 * Devuelve los horarios libres de un veterinario para una fecha.
 *
 * No tiene en cuenta los turnos cancelados y, si la fecha es hoy, descarta
 * los horarios que ya pasaron.
 *
 * @param {Array<object>} appointments Turnos existentes.
 * @param {object} options
 * @param {number|string} options.veterinarianId Veterinario.
 * @param {string} options.date Fecha ISO.
 * @param {string} [options.today] Fecha ISO de hoy.
 * @returns {string[]} Horarios disponibles.
 */
export const getFreeSlots = (
    appointments,
    { veterinarianId, date, today = toISODate(new Date()) }
) => {
    if (!veterinarianId || !date) return [];

    const taken = appointments
        .filter(
            (appointment) =>
                Number(appointment.veterinarianId) ===
                    Number(veterinarianId) &&
                appointment.date === date &&
                appointment.status !== 'cancelled'
        )
        .map((appointment) => appointment.time);

    const isToday = date === today;
    const now = currentTime();

    return TIME_SLOTS.filter(
        (slot) => !taken.includes(slot) && (!isToday || slot > now)
    );
};
