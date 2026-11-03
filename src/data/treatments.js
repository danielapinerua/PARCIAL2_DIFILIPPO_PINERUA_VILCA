import { daysFromToday } from '@/utils/dates';

const treatments = [
    { id: 1, petId: 3, veterinarianId: 2, name: 'Rehabilitación de cadera', notes: 'Fisioterapia semanal.', totalSessions: 6, startDate: daysFromToday(-21), status: 'active' },
    { id: 2, petId: 2, veterinarianId: 2, name: 'Tratamiento dermatológico', notes: 'Control de alergia en la piel.', totalSessions: 4, startDate: daysFromToday(-7), status: 'active' },
    { id: 3, petId: 5, veterinarianId: 2, name: 'Recuperación post quirúrgica', notes: 'Controles tras cirugía de paladar.', totalSessions: 3, startDate: daysFromToday(-60), status: 'completed' },
    { id: 4, petId: 9, veterinarianId: 2, name: 'Control cardíaco', notes: 'Seguimiento de soplo leve.', totalSessions: 5, startDate: daysFromToday(-35), status: 'active' },
    { id: 5, petId: 8, veterinarianId: 2, name: 'Tratamiento renal', notes: 'Se suspende a pedido del dueño.', totalSessions: 6, startDate: daysFromToday(-40), status: 'cancelled' },
    { id: 6, petId: 6, veterinarianId: 2, name: 'Tratamiento dental', notes: 'Limpieza y extracción de pieza dañada.', totalSessions: 2, startDate: daysFromToday(1), status: 'active' }
];

export default treatments;