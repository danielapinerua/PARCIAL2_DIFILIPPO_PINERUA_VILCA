import { daysFromToday } from '@/utils/dates';

const payments = [
    { id: 1, appointmentId: 1, amount: 9000, method: 'cash', date: daysFromToday(-120), registeredById: 3 },
    { id: 2, appointmentId: 2, amount: 10000, method: 'transfer', date: daysFromToday(-110), registeredById: 3 },
    { id: 3, appointmentId: 3, amount: 8000, method: 'card', date: daysFromToday(-100), registeredById: 3 },
    { id: 4, appointmentId: 4, amount: 7000, method: 'cash', date: daysFromToday(-95), registeredById: 3 },
    { id: 5, appointmentId: 5, amount: 11000, method: 'transfer', date: daysFromToday(-90), registeredById: 3 },
    { id: 6, appointmentId: 6, amount: 6000, method: 'cash', date: daysFromToday(-85), registeredById: 3 },
    { id: 7, appointmentId: 7, amount: 9000, method: 'card', date: daysFromToday(-80), registeredById: 3 },
    { id: 8, appointmentId: 8, amount: 10000, method: 'transfer', date: daysFromToday(-75), registeredById: 3 },
    { id: 9, appointmentId: 9, amount: 9500, method: 'cash', date: daysFromToday(-70), registeredById: 3 },
    { id: 10, appointmentId: 10, amount: 12000, method: 'card', date: daysFromToday(-65), registeredById: 3 },
    { id: 11, appointmentId: 11, amount: 18000, method: 'transfer', date: daysFromToday(-60), registeredById: 3 },
    { id: 12, appointmentId: 12, amount: 10000, method: 'cash', date: daysFromToday(-53), registeredById: 3 },
    { id: 13, appointmentId: 12, amount: 8000, method: 'transfer', date: daysFromToday(-50), registeredById: 3 },
    { id: 14, appointmentId: 13, amount: 18000, method: 'card', date: daysFromToday(-46), registeredById: 3 },
    { id: 15, appointmentId: 14, amount: 10000, method: 'cash', date: daysFromToday(-45), registeredById: 3 },
    { id: 16, appointmentId: 15, amount: 14000, method: 'transfer', date: daysFromToday(-40), registeredById: 3 },
    { id: 17, appointmentId: 17, amount: 16000, method: 'card', date: daysFromToday(-35), registeredById: 3 },
    { id: 18, appointmentId: 18, amount: 7000, method: 'cash', date: daysFromToday(-33), registeredById: 3 },
    { id: 19, appointmentId: 19, amount: 7500, method: 'cash', date: daysFromToday(-30), registeredById: 3 },
    { id: 20, appointmentId: 20, amount: 16000, method: 'transfer', date: daysFromToday(-28), registeredById: 3 },
    { id: 21, appointmentId: 22, amount: 15000, method: 'cash', date: daysFromToday(-21), registeredById: 3 },
    { id: 22, appointmentId: 23, amount: 6500, method: 'card', date: daysFromToday(-18), registeredById: 3 },
    { id: 23, appointmentId: 24, amount: 15000, method: 'transfer', date: daysFromToday(-14), registeredById: 3 },
    { id: 24, appointmentId: 26, amount: 5000, method: 'card', date: daysFromToday(-7), registeredById: 3 },
    { id: 25, appointmentId: 28, amount: 10000, method: 'cash', date: daysFromToday(-3), registeredById: 3 }
];

export default payments;