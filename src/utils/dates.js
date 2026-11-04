export const toISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const daysFromToday = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return toISODate(date);
};

/**
 * Convierte fechas relativas de un fixture JSON en fechas ISO.
 *
 * Los mocks guardan `dateOffsetDays` / `startDateOffsetDays` para que la data
 * mostrada siga siendo relativa al día de la carga, igual que los mocks
 * originales que usaban `daysFromToday()`.
 *
 * @param {Array<object>} items Fixture JSON.
 * @param {string} offsetKey Campo con el offset en días.
 * @param {string} dateKey Campo de fecha resultante.
 * @returns {Array<object>} Nuevos objetos con la fecha resuelta.
 */
export const hydrateDateOffset = (items, offsetKey, dateKey) => {
    const today = new Date();

    return items.map(({ [offsetKey]: offset, ...rest }) => {
        const date = new Date(today);
        date.setDate(date.getDate() + offset);
        return { ...rest, [dateKey]: toISODate(date) };
    });
};