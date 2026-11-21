import usersMock from '@/features/users/mocks/users.json';
import petsMock from '@/features/pets/mocks/pets.json';
import appointmentsMock from '@/features/appointments/mocks/appointments.json';
import treatmentsMock from '@/features/treatments/mocks/treatments.json';
import paymentsMock from '@/features/payments/mocks/payments.json';
import { hydrateDateOffset } from '@/utils/dates';

const API_READY = import.meta.env.VITE_API_READY === 'true';
const SEED_VERSION = '1';
const SEED_VERSION_KEY = 'patasana_seed_version';

const SEED_KEYS = [
    'patasana_users',
    'patasana_pets',
    'patasana_appointments',
    'patasana_treatments',
    'patasana_payments',
];

const ensure = (key, value) => {
    try {
        const stored = localStorage.getItem(key);

        if (stored !== null) {
            const parsed = JSON.parse(stored);
            // Todas las entidades del seed son colecciones.
            if (Array.isArray(parsed)) return;
        }
    } catch {
        // Si la clave no se puede leer o el JSON está corrupto, se resiembra.
    }

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Si localStorage no está disponible, las APIs usan el fallback JSON.
    }
};

/**
 * Siembra localStorage con los datos iniciales de los mocks.
 *
 * Solo crea las claves faltantes o corruptas. No sobrescribe datos existentes.
 * Se ejecuta una sola vez al inicio de la aplicación, antes de montar React.
 */
export const setupMockStorage = () => {
    if (API_READY) return;

    const appointments = hydrateDateOffset(
        appointmentsMock,
        'dateOffsetDays',
        'date'
    );
    const treatments = hydrateDateOffset(
        treatmentsMock,
        'startDateOffsetDays',
        'startDate'
    );
    const payments = hydrateDateOffset(
        paymentsMock,
        'dateOffsetDays',
        'date'
    );

    ensure('patasana_users', usersMock);
    ensure('patasana_pets', petsMock);
    ensure('patasana_appointments', appointments);
    ensure('patasana_treatments', treatments);
    ensure('patasana_payments', payments);

    try {
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    } catch {
        // noop
    }
};

export { SEED_KEYS, SEED_VERSION };
