// Bloques de 30 minutos de 09:00 a 17:30.
export const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
    const hours = String(9 + Math.floor(i / 2)).padStart(2, '0');
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hours}:${minutes}`;
});

// Importe base de una consulta pedida por el cliente.
// En turnos de tratamientos lo define el veterinario.
export const DEFAULT_AMOUNT = 10000;

const normalizeDate = (value) => String(value ?? '').slice(0, 10);
const normalizeTime = (value) => String(value ?? '').slice(0, 5);

/**
 * Devuelve los horarios libres de un veterinario para una fecha.
 *
 * No tiene en cuenta los turnos cancelados. Las fechas y horarios pasados
 * también se consideran válidos: la agenda permite cargar datos históricos.
 *
 * @param {Array<object>} appointments Turnos existentes.
 * @param {object} options
 * @param {number|string} options.veterinarianId Veterinario.
 * @param {string} options.date Fecha ISO.
 * @returns {string[]} Horarios disponibles.
 */
export const getFreeSlots = (appointments, { veterinarianId, date }) => {
    if (!veterinarianId || !date) return [];

    const normalizedDate = normalizeDate(date);

    const taken = appointments
        .filter(
            (appointment) =>
                Number(appointment.veterinarianId) ===
                    Number(veterinarianId) &&
                normalizeDate(appointment.date) === normalizedDate &&
                appointment.status !== 'cancelled'
        )
        .map((appointment) => normalizeTime(appointment.time));

    return TIME_SLOTS.filter((slot) => !taken.includes(slot));
};
