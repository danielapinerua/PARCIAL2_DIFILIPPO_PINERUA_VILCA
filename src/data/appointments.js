import { daysFromToday } from '@/utils/dates';

const appointments = [
    // Pasados
    { id: 1, petId: 1, veterinarianId: 2, treatmentId: null, date: daysFromToday(-120), time: '09:00', reason: 'Vacunación anual', status: 'completed', amount: 9000, notes: 'Se aplica vacuna séxtuple.' },
    { id: 2, petId: 8, veterinarianId: 2, treatmentId: null, date: daysFromToday(-110), time: '10:30', reason: 'Control general', status: 'completed', amount: 10000, notes: 'Buen estado general.' },
    { id: 3, petId: 6, veterinarianId: 2, treatmentId: null, date: daysFromToday(-100), time: '11:00', reason: 'Limpieza de oídos', status: 'completed', amount: 8000, notes: 'Leve otitis, se indican gotas.' },
    { id: 4, petId: 7, veterinarianId: 2, treatmentId: null, date: daysFromToday(-95), time: '15:00', reason: 'Control de peso', status: 'completed', amount: 7000, notes: 'Peso adecuado.' },
    { id: 5, petId: 9, veterinarianId: 2, treatmentId: null, date: daysFromToday(-90), time: '09:30', reason: 'Control geriátrico', status: 'completed', amount: 11000, notes: 'Se detecta soplo leve.' },
    { id: 6, petId: 4, veterinarianId: 2, treatmentId: null, date: daysFromToday(-85), time: '16:30', reason: 'Corte de uñas y pico', status: 'completed', amount: 6000, notes: 'Sin novedades.' },
    { id: 7, petId: 10, veterinarianId: 2, treatmentId: null, date: daysFromToday(-80), time: '10:00', reason: 'Control de caparazón', status: 'completed', amount: 9000, notes: 'Caparazón sano.' },
    { id: 8, petId: 1, veterinarianId: 2, treatmentId: null, date: daysFromToday(-75), time: '14:00', reason: 'Consulta por vómitos', status: 'completed', amount: 10000, notes: 'Gastritis leve, dieta blanda.' },
    { id: 9, petId: 2, veterinarianId: 2, treatmentId: null, date: daysFromToday(-70), time: '12:00', reason: 'Vacunación triple felina', status: 'completed', amount: 9500, notes: 'Vacuna aplicada sin reacciones.' },
    { id: 10, petId: 5, veterinarianId: 2, treatmentId: null, date: daysFromToday(-65), time: '09:00', reason: 'Consulta prequirúrgica', status: 'completed', amount: 12000, notes: 'Apto para cirugía.' },
    { id: 11, petId: 5, veterinarianId: 2, treatmentId: 3, date: daysFromToday(-60), time: '10:00', reason: 'Control post quirúrgico 1', status: 'completed', amount: 18000, notes: 'Buena cicatrización.' },
    { id: 12, petId: 5, veterinarianId: 2, treatmentId: 3, date: daysFromToday(-53), time: '10:00', reason: 'Control post quirúrgico 2', status: 'completed', amount: 18000, notes: 'Respira mejor.' },
    { id: 13, petId: 5, veterinarianId: 2, treatmentId: 3, date: daysFromToday(-46), time: '10:00', reason: 'Control post quirúrgico 3', status: 'completed', amount: 18000, notes: 'Alta del tratamiento.' },
    { id: 14, petId: 3, veterinarianId: 2, treatmentId: null, date: daysFromToday(-45), time: '15:30', reason: 'Consulta por cojera', status: 'completed', amount: 10000, notes: 'Displasia de cadera, se indica rehabilitación.' },
    { id: 15, petId: 8, veterinarianId: 2, treatmentId: 5, date: daysFromToday(-40), time: '11:00', reason: 'Sesión renal 1', status: 'completed', amount: 14000, notes: 'Se inicia suero subcutáneo.' },
    { id: 16, petId: 6, veterinarianId: 2, treatmentId: null, date: daysFromToday(-38), time: '17:00', reason: 'Control general', status: 'cancelled', amount: 10000, notes: '' },
    { id: 17, petId: 9, veterinarianId: 2, treatmentId: 4, date: daysFromToday(-35), time: '09:30', reason: 'Control cardíaco 1', status: 'completed', amount: 16000, notes: 'Ecocardiograma inicial.' },
    { id: 18, petId: 8, veterinarianId: 2, treatmentId: 5, date: daysFromToday(-33), time: '11:00', reason: 'Sesión renal 2', status: 'completed', amount: 14000, notes: 'Valores estables.' },
    { id: 19, petId: 7, veterinarianId: 2, treatmentId: null, date: daysFromToday(-30), time: '13:00', reason: 'Revisión dental', status: 'completed', amount: 7500, notes: 'Dientes algo largos, control en un mes.' },
    { id: 20, petId: 9, veterinarianId: 2, treatmentId: 4, date: daysFromToday(-28), time: '09:30', reason: 'Control cardíaco 2', status: 'completed', amount: 16000, notes: 'Responde bien a la medicación.' },
    { id: 21, petId: 8, veterinarianId: 2, treatmentId: 5, date: daysFromToday(-26), time: '11:00', reason: 'Sesión renal 3', status: 'cancelled', amount: 14000, notes: '' },
    { id: 22, petId: 3, veterinarianId: 2, treatmentId: 1, date: daysFromToday(-21), time: '10:00', reason: 'Sesión 1 de rehabilitación', status: 'completed', amount: 15000, notes: 'Buena respuesta al ejercicio.' },
    { id: 23, petId: 1, veterinarianId: 2, treatmentId: null, date: daysFromToday(-18), time: '16:00', reason: 'Desparasitación', status: 'completed', amount: 6500, notes: 'Antiparasitario interno aplicado.' },
    { id: 24, petId: 3, veterinarianId: 2, treatmentId: 1, date: daysFromToday(-14), time: '10:00', reason: 'Sesión 2 de rehabilitación', status: 'completed', amount: 15000, notes: 'Mejora la movilidad.' },
    { id: 25, petId: 4, veterinarianId: 2, treatmentId: null, date: daysFromToday(-10), time: '12:30', reason: 'Consulta por plumas caídas', status: 'cancelled', amount: 8000, notes: '' },
    { id: 26, petId: 3, veterinarianId: 2, treatmentId: 1, date: daysFromToday(-7), time: '10:00', reason: 'Sesión 3 de rehabilitación', status: 'completed', amount: 15000, notes: 'Camina sin dolor.' },
    { id: 27, petId: 2, veterinarianId: 2, treatmentId: 2, date: daysFromToday(-7), time: '16:00', reason: 'Sesión 1 dermatológica', status: 'completed', amount: 12000, notes: 'Se indica shampoo medicado.' },
    { id: 28, petId: 8, veterinarianId: 2, treatmentId: null, date: daysFromToday(-3), time: '14:30', reason: 'Control post tratamiento', status: 'completed', amount: 10000, notes: 'Estable sin tratamiento.' },
    { id: 29, petId: 6, veterinarianId: 2, treatmentId: null, date: daysFromToday(-2), time: '11:30', reason: 'Consulta por estornudos', status: 'completed', amount: 9000, notes: 'Rinitis leve, se indica nebulización.' },

    // Hoy
    { id: 30, petId: 1, veterinarianId: 2, treatmentId: null, date: daysFromToday(0), time: '09:00', reason: 'Control anual', status: 'confirmed', amount: 10000, notes: '' },
    { id: 31, petId: 7, veterinarianId: 2, treatmentId: null, date: daysFromToday(0), time: '09:30', reason: 'Control de peso', status: 'confirmed', amount: 7000, notes: '' },
    { id: 32, petId: 3, veterinarianId: 2, treatmentId: 1, date: daysFromToday(0), time: '10:00', reason: 'Sesión 4 de rehabilitación', status: 'confirmed', amount: 15000, notes: '' },
    { id: 33, petId: 4, veterinarianId: 2, treatmentId: null, date: daysFromToday(0), time: '11:30', reason: 'Revisión de plumaje', status: 'pending', amount: 8000, notes: '' },
    { id: 34, petId: 9, veterinarianId: 2, treatmentId: null, date: daysFromToday(0), time: '14:00', reason: 'Control de presión', status: 'confirmed', amount: 11000, notes: '' },
    { id: 35, petId: 2, veterinarianId: 2, treatmentId: 2, date: daysFromToday(0), time: '16:00', reason: 'Sesión 2 dermatológica', status: 'confirmed', amount: 12000, notes: '' },
    { id: 36, petId: 5, veterinarianId: 2, treatmentId: null, date: daysFromToday(0), time: '17:30', reason: 'Revisión de cicatriz', status: 'pending', amount: 9000, notes: '' },

    // Futuros
    { id: 37, petId: 6, veterinarianId: 2, treatmentId: 6, date: daysFromToday(1), time: '10:00', reason: 'Limpieza dental', status: 'pending', amount: 20000, notes: '' },
    { id: 38, petId: 1, veterinarianId: 2, treatmentId: null, date: daysFromToday(2), time: '14:00', reason: 'Vacunación', status: 'pending', amount: 9000, notes: '' },
    { id: 39, petId: 8, veterinarianId: 2, treatmentId: null, date: daysFromToday(3), time: '11:00', reason: 'Análisis de sangre', status: 'confirmed', amount: 13000, notes: '' },
    { id: 40, petId: 9, veterinarianId: 2, treatmentId: 4, date: daysFromToday(5), time: '09:30', reason: 'Control cardíaco 3', status: 'confirmed', amount: 16000, notes: '' },
    { id: 41, petId: 4, veterinarianId: 2, treatmentId: null, date: daysFromToday(7), time: '15:00', reason: 'Control general', status: 'pending', amount: 8000, notes: '' },
    { id: 42, petId: 6, veterinarianId: 2, treatmentId: 6, date: daysFromToday(8), time: '10:00', reason: 'Extracción dental', status: 'pending', amount: 20000, notes: '' },
    { id: 43, petId: 7, veterinarianId: 2, treatmentId: null, date: daysFromToday(10), time: '12:00', reason: 'Revisión dental', status: 'pending', amount: 7500, notes: '' },
    { id: 44, petId: 5, veterinarianId: 2, treatmentId: null, date: daysFromToday(14), time: '16:30', reason: 'Vacuna antirrábica', status: 'pending', amount: 8500, notes: '' }
];

export default appointments;