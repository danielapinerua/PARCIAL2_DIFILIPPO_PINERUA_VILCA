import { useMemo, useState } from 'react';
import { toISODate } from '@/utils/dates';
import { createAppointment } from '../api';
import { getFreeSlots } from '../utils';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Modal from '@/components/Modal/Modal';
import Select from '@/components/Select/Select';
import Textarea from '@/components/Textarea/Textarea';
import useToast from '@/components/Toast/useToast';
import './NewAppointmentModal.css';

const formatDisplayDate = (iso) => {
    if (!iso) return '—';
    const [year, month, day] = iso.split('-');
    if (!year || !month || !day) return iso;
    return `${day}/${month}/${year}`;
};

/**
 * Modal para que recepción cree un turno desde la agenda.
 *
 * La fecha y el horario pueden venir precargados desde el click en el
 * calendario; el horario siempre se puede cambiar entre los libres del
 * veterinario elegido.
 *
 * @param {object} props
 * @param {boolean} props.isOpen Si el modal está abierto.
 * @param {{date: string, time?: string}|null} props.initialSlot Slot inicial.
 * @param {number|string} [props.defaultVetId] Veterinario preseleccionado.
 * @param {Array<object>} props.pets Mascotas.
 * @param {Array<object>} props.vets Veterinarios.
 * @param {Array<object>} props.treatments Tratamientos.
 * @param {Array<object>} props.appointments Turnos existentes.
 * @param {Function} props.onClose Cierra el modal.
 * @param {Function} [props.onCreated] Se ejecuta después de crear el turno.
 */
function NewAppointmentModal({
    isOpen,
    initialSlot,
    defaultVetId = '',
    pets,
    vets,
    treatments,
    appointments,
    onClose,
    onCreated,
}) {
    const toast = useToast();
    const [today] = useState(() => toISODate(new Date()));
    const [form, setForm] = useState(() => {
        const date = initialSlot?.date || today;
        const vetId = defaultVetId ? String(defaultVetId) : '';
        const time = initialSlot?.time || '';

        const timeIsFree =
            !vetId ||
            !time ||
            getFreeSlots(appointments, {
                veterinarianId: vetId,
                date,
            }).includes(time);

        return {
            petId: '',
            vetId,
            treatmentId: '',
            date,
            time: timeIsFree ? time : '',
            reason: '',
            amount: '',
            notes: '',
        };
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const petOptions = useMemo(
        () =>
            pets
                .filter((pet) => pet.active !== false)
                .map((pet) => ({
                    value: String(pet.id),
                    label: pet.name,
                })),
        [pets]
    );

    const vetOptions = useMemo(
        () =>
            vets
                .filter((vet) => vet.active !== false)
                .map((vet) => ({
                    value: String(vet.id),
                    label: `Dr. ${vet.firstName} ${vet.lastName}`,
                })),
        [vets]
    );

    const freeSlots = useMemo(
        () =>
            getFreeSlots(appointments, {
                veterinarianId: form.vetId,
                date: form.date,
            }),
        [appointments, form.vetId, form.date]
    );

    const treatmentOptions = useMemo(() => {
        if (!form.petId || !form.vetId) return [];

        const options = [
            { value: '', label: 'Sin tratamiento (consulta)' },
        ];

        treatments
            .filter((treatment) => {
                if (treatment.status !== 'active') return false;
                if (Number(treatment.petId) !== Number(form.petId)) {
                    return false;
                }
                if (
                    Number(treatment.veterinarianId) !== Number(form.vetId)
                ) {
                    return false;
                }

                const occupied = appointments.filter(
                    (appointment) =>
                        Number(appointment.treatmentId) ===
                            Number(treatment.id) &&
                        appointment.status !== 'cancelled'
                ).length;

                return occupied < Number(treatment.totalSessions);
            })
            .forEach((treatment) => {
                options.push({
                    value: String(treatment.id),
                    label: treatment.name,
                });
            });

        return options;
    }, [appointments, treatments, form.petId, form.vetId]);

    const updateField = (field) => (event) => {
        const { value } = event.target;

        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    const handlePetChange = (event) => {
        const petId = event.target.value;
        setForm((current) => ({
            ...current,
            petId,
            treatmentId: '',
        }));
        setErrors((current) => ({ ...current, petId: '', treatmentId: '' }));
    };

    const handleVetChange = (event) => {
        const vetId = event.target.value;
        const nextSlots = getFreeSlots(appointments, {
            veterinarianId: vetId,
            date: form.date,
        });

        setForm((current) => ({
            ...current,
            vetId,
            treatmentId: '',
            time: nextSlots.includes(current.time) ? current.time : '',
        }));
        setErrors((current) => ({
            ...current,
            vetId: '',
            treatmentId: '',
            time: '',
        }));
    };

    const handleDateChange = (event) => {
        setForm((current) => ({
            ...current,
            date: event.target.value,
            time: '',
        }));
        setErrors((current) => ({ ...current, date: '', time: '' }));
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.petId) nextErrors.petId = 'Elegí la mascota.';
        if (!form.vetId) nextErrors.vetId = 'Elegí el veterinario.';

        if (!form.date) {
            nextErrors.date = 'Elegí la fecha.';
        }

        if (!form.time) {
            nextErrors.time = 'Elegí un horario libre.';
        } else if (!freeSlots.includes(form.time)) {
            nextErrors.time = 'Ese horario ya no está disponible.';
        }

        if (!form.reason.trim()) {
            nextErrors.reason = 'Ingresá el motivo del turno.';
        }

        if (form.amount === '') {
            nextErrors.amount = 'Ingresá el importe.';
        } else if (
            Number.isNaN(Number(form.amount)) ||
            Number(form.amount) < 0
        ) {
            nextErrors.amount = 'El importe debe ser un número mayor o igual a 0.';
        }

        return nextErrors;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) return;

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);

        try {
            await createAppointment({
                petId: Number(form.petId),
                veterinarianId: Number(form.vetId),
                treatmentId: form.treatmentId
                    ? Number(form.treatmentId)
                    : null,
                date: form.date,
                time: form.time,
                reason: form.reason.trim(),
                status: 'confirmed',
                amount: Number(form.amount),
                notes: form.notes.trim(),
            });

            toast.success('Turno creado y confirmado.');
            setSaving(false);
            onClose();
            onCreated?.();
        } catch (err) {
            toast.error(err.message || 'No se pudo crear el turno.');
            setSaving(false);
        }
    };

    const handleClose = saving ? () => {} : onClose;

    return (
        <Modal
            isOpen={isOpen}
            title="Nuevo turno"
            onClose={handleClose}
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="new-appointment-form"
                        loading={saving}
                    >
                        Guardar turno
                    </Button>
                </>
            }
        >
            <p className="new-appointment-modal__context">
                Fecha seleccionada: {formatDisplayDate(form.date)}
                {form.time ? ` · Horario: ${form.time}` : ''}
            </p>

            <form
                id="new-appointment-form"
                className="new-appointment-modal__form"
                onSubmit={handleSubmit}
                noValidate
            >
                <Select
                    label="Mascota"
                    options={petOptions}
                    value={form.petId}
                    onChange={handlePetChange}
                    placeholder="Elegí una mascota"
                    error={errors.petId}
                    data-autofocus
                />
                <Select
                    label="Veterinario"
                    options={vetOptions}
                    value={form.vetId}
                    onChange={handleVetChange}
                    placeholder="Elegí un veterinario"
                    error={errors.vetId}
                />

                <Input
                    label="Fecha"
                    type="date"
                    value={form.date}
                    onChange={handleDateChange}
                    error={errors.date}
                    required
                />
                <Select
                    label="Horario"
                    options={freeSlots.map((slot) => ({
                        value: slot,
                        label: slot,
                    }))}
                    value={form.time}
                    onChange={updateField('time')}
                    placeholder={
                        form.vetId
                            ? 'Elegí un horario libre'
                            : 'Primero elegí un veterinario'
                    }
                    disabled={!form.vetId || freeSlots.length === 0}
                    error={errors.time}
                />

                <div className="new-appointment-modal__full">
                    <Select
                        label="Tratamiento (opcional)"
                        options={treatmentOptions}
                        value={form.treatmentId}
                        onChange={updateField('treatmentId')}
                        disabled={!form.petId || !form.vetId}
                        helpText={
                            form.petId && form.vetId && treatmentOptions.length === 1
                                ? 'No hay tratamientos activos con sesiones disponibles para esta mascota y veterinario.'
                                : undefined
                        }
                    />
                </div>

                {form.date && form.vetId && freeSlots.length === 0 && (
                    <p className="new-appointment-modal__notice">
                        No hay horarios libres ese día para el veterinario
                        elegido. Probá con otra fecha.
                    </p>
                )}

                <div className="new-appointment-modal__full">
                    <Input
                        label="Motivo"
                        value={form.reason}
                        onChange={updateField('reason')}
                        placeholder="Ej. Control de seguimiento"
                        maxLength={120}
                        error={errors.reason}
                        required
                    />
                </div>

                <Input
                    label="Importe ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={updateField('amount')}
                    placeholder="Ej. 15000"
                    error={errors.amount}
                    required
                />

                <div className="new-appointment-modal__full">
                    <Textarea
                        label="Notas (opcional)"
                        value={form.notes}
                        onChange={updateField('notes')}
                        rows={3}
                        maxLength={300}
                    />
                </div>
            </form>
        </Modal>
    );
}

export default NewAppointmentModal;
