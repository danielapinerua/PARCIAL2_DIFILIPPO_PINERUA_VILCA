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