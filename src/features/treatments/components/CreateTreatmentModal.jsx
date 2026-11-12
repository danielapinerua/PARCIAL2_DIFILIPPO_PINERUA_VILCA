import { useId, useState } from 'react';
import { toISODate } from '@/utils/dates';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Modal from '@/components/Modal/Modal';
import Select from '@/components/Select/Select';
import Textarea from '@/components/Textarea/Textarea';
import useToast from '@/components/Toast/useToast';
import { createTreatment } from '../api';
import './TreatmentModal.css';

const emptyForm = (today) => ({
    petId: '',
    name: '',
    notes: '',
    totalSessions: '1',
    startDate: today,
});

/**
 * Modal para crear un tratamiento.
 *
 * @param {object} props
 * @param {boolean} props.isOpen Si el modal está abierto.
 * @param {Array<object>} props.pets Mascotas disponibles.
 * @param {number} props.veterinarianId Veterinario responsable.
 * @param {Function} props.onClose Cierra el modal.
 * @param {Function} [props.onCreated] Se ejecuta después de crear el tratamiento.
 */
function CreateTreatmentModal({
    isOpen,
    pets = [],
    veterinarianId,
    onClose,
    onCreated,
}) {
    const toast = useToast();
    const formId = useId();
    const [today] = useState(() => toISODate(new Date()));
    const [form, setForm] = useState(() => emptyForm(today));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const activePets = pets.filter((pet) => pet.active !== false);

    const updateField = (field) => (event) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.petId) nextErrors.petId = 'Elegí la mascota.';
        if (!form.name.trim()) nextErrors.name = 'Ingresá el nombre del tratamiento.';
        if (!form.startDate) nextErrors.startDate = 'Elegí la fecha de inicio.';

        const total = Number(form.totalSessions);
        if (
            !form.totalSessions ||
            Number.isNaN(total) ||
            !Number.isInteger(total) ||
            total < 1
        ) {
            nextErrors.totalSessions =
                'La cantidad de sesiones tiene que ser un número entero mayor o igual a 1.';
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
            await createTreatment({
                petId: Number(form.petId),
                veterinarianId,
                name: form.name.trim(),
                notes: form.notes.trim(),
                totalSessions: Number(form.totalSessions),
                startDate: form.startDate,
                status: 'active',
            });

            toast.success(`Tratamiento "${form.name.trim()}" creado.`);
            setSaving(false);
            onClose();
            onCreated?.();
        } catch (err) {
            toast.error(err.message || 'No se pudo crear el tratamiento.');
            setSaving(false);
        }
    };

    const handleClose = saving ? () => {} : onClose;

    return (
        <Modal
            isOpen={isOpen}
            title="Nuevo tratamiento"
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
                        disabled={activePets.length === 0}
                    >
                        Guardar tratamiento
                    </Button>
                </>
            }
        >
            <p className="treatment-modal__context">
                Cargá los datos del tratamiento. Después vas a poder agendar
                sus sesiones desde el detalle.
            </p>

            <form
                id={formId}
                className="treatment-modal__form"
                onSubmit={handleSubmit}
                noValidate
            >
                <Select
                    label="Mascota"
                    options={activePets.map((pet) => ({
                        value: String(pet.id),
                        label: pet.name,
                    }))}
                    value={form.petId}
                    onChange={updateField('petId')}
                    placeholder="Elegí una mascota"
                    error={errors.petId}
                    disabled={activePets.length === 0}
                    data-autofocus
                />

                <Input
                    label="Fecha de inicio"
                    type="date"
                    value={form.startDate}
                    onChange={updateField('startDate')}
                    error={errors.startDate}
                    required
                />

                <div className="treatment-modal__full">
                    <Input
                        label="Nombre del tratamiento"
                        value={form.name}
                        onChange={updateField('name')}
                        placeholder="Ej. Tratamiento dermatológico"
                        maxLength={100}
                        error={errors.name}
                        required
                    />
                </div>

                <Input
                    label="Cantidad de sesiones"
                    type="number"
                    min="1"
                    step="1"
                    value={form.totalSessions}
                    onChange={updateField('totalSessions')}
                    error={errors.totalSessions}
                    required
                />

                <div className="treatment-modal__full">
                    <Textarea
                        label="Observaciones"
                        value={form.notes}
                        onChange={updateField('notes')}
                        placeholder="Indicaciones y observaciones del tratamiento"
                        rows={4}
                        maxLength={500}
                    />
                </div>

                {activePets.length === 0 && (
                    <p className="treatment-modal__notice">
                        No hay mascotas activas disponibles. Cargá una mascota
                        antes de crear un tratamiento.
                    </p>
                )}
            </form>
        </Modal>
    );
}

export default CreateTreatmentModal;
