import initialUsers from '@/data/users';
import initialPets from '@/data/pets';
import initialTreatments from '@/data/treatments';
import initialAppointments from '@/data/appointments';
import initialPayments from '@/data/payments';

const KEYS = {
    users: 'patasana_users',
    pets: 'patasana_pets',
    treatments: 'patasana_treatments',
    appointments: 'patasana_appointments',
    payments: 'patasana_payments',
};

const load = (key, initial) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initial;
    } catch {
        return initial;
    }
};

const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const getUsers = () => load(KEYS.users, initialUsers);
export const saveUsers = (data) => save(KEYS.users, data);

export const getPets = () => load(KEYS.pets, initialPets);
export const savePets = (data) => save(KEYS.pets, data);

export const getTreatments = () => load(KEYS.treatments, initialTreatments);
export const saveTreatments = (data) => save(KEYS.treatments, data);

export const getAppointments = () => load(KEYS.appointments, initialAppointments);
export const saveAppointments = (data) => save(KEYS.appointments, data);

export const getPayments = () => load(KEYS.payments, initialPayments);
export const savePayments = (data) => save(KEYS.payments, data);