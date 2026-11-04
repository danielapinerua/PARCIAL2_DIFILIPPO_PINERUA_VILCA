import paymentsMock from './mocks/payments.json';
import { hydrateDateOffset } from '@/utils/dates';

const API_READY = import.meta.env.VITE_API_READY === 'true';
const STORAGE_KEY = 'patasana_payments';
const initialPayments = hydrateDateOffset(paymentsMock, 'dateOffsetDays', 'date');

const readMock = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : initialPayments;
    } catch {
        return initialPayments;
    }
};

/**
 * Obtiene los pagos.
 *
 * En modo mock devuelve el JSON de `mocks/payments.json` (o lo persistido en
 * localStorage). En modo API consulta `GET /payments`.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getPayments() {
    if (!API_READY) {
        return readMock();
    }

    const response = await fetch('/payments');
    if (!response.ok) {
        throw new Error('No se pudieron obtener los pagos.');
    }
    return response.json();
}
