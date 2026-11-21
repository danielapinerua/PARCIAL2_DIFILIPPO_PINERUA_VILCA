import { useId, useMemo, useState } from 'react';
import { createAppointment } from '@/features/appointments';
import { getFreeSlots } from '@/features/appointments/utils';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Modal from '@/components/Modal/Modal';
import Select from '@/components/Select/Select';
import useToast from '@/components/Toast/useToast';
import './TreatmentModal.css';

const EMPTY_FORM = { date: '', time: '', reason: '', amount: '' };

/**
 * Modal para agendar una sesión de un tratamiento.
 *
 * Reutiliza la lógica de horarios libres de los turnos y crea un appointment
 * asociado al tratamiento para que la sesión también aparezca en la agenda.
 *
 * @param {object} props
 * @param {boolean} props.isOpen Si el modal está abierto.
 * @param {object} props.treatment Tratamiento al que se le agrega la sesión.
 * @param {string} [props.petName] Nombre de la mascota, para el contexto.
 * @param {number} [props.nextSessionNumber] Número de la sesión a agendar.
 * @param {Array<object>} props.appointments Turnos existentes.
 * @param {Function} props.onClose Cierra el modal.
 * @param {Function} [props.onScheduled] Se ejecuta después de crear la sesión.
 */
function ScheduleSessionModal({
    isOpen,
    treatment,
    petName,
    nextSessionNumber,
    appointments = [],
    onClose,
    onScheduled,
}) {
    const toast = useToast();
    const formId = useId();
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const freeSlots = useMemo(
        () =>
            getFreeSlots(appointments, {
                veterinarianId: treatment?.veterinarianId,
                date: form.date,
            }),
        [appointments, treatment, form.date]
    );

    const updateField = (field) => (event) => {
        const { value } = event.target;

        setForm((current) => ({
            ...current,
            [field]: value,
            // Si cambia la fecha, el horario elegido deja de ser válido.
            ...(field === 'date' ? { time: '' } : {}),
        }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.date) {
            nextErrors.date = 'Elegí la fecha de la sesión.';
        }

        if (!form.time) {
            nextErrors.time = 'Elegí un horario libre.';
        } else if (form.date && !freeSlots.includes(form.time)) {
            nextErrors.time = 'Ese horario ya no está disponible.';
        }

        if (!form.reason.trim()) {
            nextErrors.reason = 'Ingresá el motivo de la sesión.';
        }

        if (form.amount === '') {
            nextErrors.amount = 'Ingresá el importe de la sesión.';
        } else if (
            Number.isNaN(Number(form.amount)) ||
            Number(form.amount) < 0
        ) {
            nextErrors.amount = 'El importe tiene que ser un número mayor o igual a 0.';
        }

        return nextErrors;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!treatment || saving) return;

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);

        try {
            await createAppointment({
                petId: treatment.petId,
                veterinarianId: treatment.veterinarianId,
                treatmentId: treatment.id,
                date: form.date,
                time: form.time,
                reason: form.reason.trim(),
                status: 'pending',
                amount: Number(form.amount),
                notes: '',
            });

            toast.success('Sesión agendada.');
            setSaving(false);
            onClose();
            onScheduled?.();
        } catch (err) {
            toast.error(err.message || 'No se pudo agendar la sesión.');
            setSaving(false);
        }
    };

    const handleClose = saving ? () => {} : onClose;
    const context = [treatment?.name, petName].filter(Boolean).join(' · ');
    const totalSessions = treatment?.totalSessions;

    return (
        <Modal
            isOpen={isOpen}
            title="Agendar sesión"
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
                        form={formId}
                        loading={saving}
                    >
                        Agendar sesión
                    </Button>
                </>
            }
        >
            {context && (
                <p className="treatment-modal__context">
                    {context}
                    {nextSessionNumber && totalSessions
                        ? ` · Sesión ${nextSessionNumber} de ${totalSessions}`
                        : ''}
                </p>
            )}

            <form
                id={formId}
                className="treatment-modal__form"
                onSubmit={handleSubmit}
                noValidate
            >
                <Input
                    label="Fecha"
                    type="date"
                    value={form.date}
                    onChange={updateField('date')}
                    error={errors.date}
                    required
                    data-autofocus
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
                        form.date
                            ? 'Elegí un horario libre'
                            : 'Primero elegí la fecha'
                    }
                    disabled={!form.date || freeSlots.length === 0}
                    error={errors.time}
                />

                {form.date && freeSlots.length === 0 && (
                    <p className="treatment-modal__notice">
                        No hay horarios libres ese día. Probá con otra fecha.
                    </p>
                )}

                <div className="treatment-modal__full">
                    <Input
                        label="Motivo"
                        value={form.reason}
                        onChange={updateField('reason')}
                        placeholder="Ej. Sesión 1 de rehabilitación"
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
            </form>
        </Modal>
    );
}

export default ScheduleSessionModal;
