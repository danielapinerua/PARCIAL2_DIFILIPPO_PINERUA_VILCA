import { useId, useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Modal from '@/components/Modal/Modal';
import Select from '@/components/Select/Select';
import useToast from '@/components/Toast/useToast';
import { createUser, updateUser } from '../api';
import './UserFormModal.css';

const ROLE_OPTIONS = [
    { value: 'client', label: 'Cliente' },
    { value: 'veterinarian', label: 'Veterinario' },
    { value: 'receptionist', label: 'Recepcionista' },
    { value: 'admin', label: 'Administrador' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
};

const formFromUser = (user) =>
    user
        ? {
              firstName: user.firstName ?? '',
              lastName: user.lastName ?? '',
              email: user.email ?? '',
              phone: user.phone ?? '',
              role: user.role ?? '',
              password: '',
          }
        : emptyForm;

/**
 * Modal para crear o editar un usuario desde el panel del administrador.
 *
 * @param {object} props
 * @param {boolean} props.isOpen Si el modal está abierto.
 * @param {object|null} props.user Usuario a editar, o null para crear.
 * @param {boolean} [props.isSelf] Si el usuario editado es el admin logueado.
 * @param {Function} props.onClose Cierra el modal.
 * @param {Function} [props.onSaved] Se ejecuta con el usuario guardado.
 */
function UserFormModal({ isOpen, user, isSelf = false, onClose, onSaved }) {
    const toast = useToast();
    const formId = useId();
    const isEditing = Boolean(user);
    const [form, setForm] = useState(() => formFromUser(user));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const updateField = (field) => (event) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.firstName.trim()) nextErrors.firstName = 'Ingresá el nombre.';
        if (!form.lastName.trim()) nextErrors.lastName = 'Ingresá el apellido.';

        if (!form.email.trim()) {
            nextErrors.email = 'Ingresá el correo electrónico.';
        } else if (!EMAIL_REGEX.test(form.email.trim())) {
            nextErrors.email = 'Ingresá un correo válido.';
        }

        if (!form.phone.trim()) {
            nextErrors.phone = 'Ingresá el teléfono.';
        } else if (!/^\d{8,15}$/.test(form.phone.replace(/[\s-]/g, ''))) {
            nextErrors.phone = 'El teléfono debe tener entre 8 y 15 números.';
        }

        if (!form.role) nextErrors.role = 'Elegí un rol.';

        if (!isEditing && form.password.length < 6) {
            nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
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

        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            role: form.role,
        };

        try {
            const saved = isEditing
                ? await updateUser(user.id, payload)
                : await createUser({
                      ...payload,
                      password: form.password,
                      active: true,
                  });

            toast.success(
                isEditing
                    ? 'Usuario actualizado.'
                    : 'Usuario creado correctamente.'
            );
            setSaving(false);
            onSaved?.(saved);
            onClose();
        } catch (err) {
            if (err.message.includes('correo')) {
                setErrors({ email: err.message });
            } else {
                toast.error(err.message || 'No se pudo guardar el usuario.');
            }
            setSaving(false);
        }
    };

    const handleClose = saving ? () => {} : onClose;

    return (
        <Modal
            isOpen={isOpen}
            title={isEditing ? 'Editar usuario' : 'Nuevo usuario'}
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
                        {isEditing ? 'Guardar cambios' : 'Crear usuario'}
                    </Button>
                </>
            }
        >
            <form
                id={formId}
                className="user-form-modal__form"
                onSubmit={handleSubmit}
                noValidate
            >
                <Input
                    label="Nombre"
                    value={form.firstName}
                    onChange={updateField('firstName')}
                    error={errors.firstName}
                    maxLength={60}
                    required
                    data-autofocus
                />
                <Input
                    label="Apellido"
                    value={form.lastName}
                    onChange={updateField('lastName')}
                    error={errors.lastName}
                    maxLength={60}
                    required
                />
                <Input
                    label="Correo electrónico"
                    type="email"
                    value={form.email}
                    onChange={updateField('email')}
                    error={errors.email}
                    maxLength={120}
                    required
                />
                <Input
                    label="Teléfono"
                    value={form.phone}
                    onChange={updateField('phone')}
                    error={errors.phone}
                    placeholder="1155550001"
                    maxLength={20}
                    required
                />
                <Select
                    label="Rol"
                    options={ROLE_OPTIONS}
                    value={form.role}
                    onChange={updateField('role')}
                    placeholder="Elegí un rol"
                    error={errors.role}
                    disabled={isSelf}
                    helpText={
                        isSelf
                            ? 'No podés cambiar tu propio rol.'
                            : undefined
                    }
                />

                {!isEditing && (
                    <Input
                        label="Contraseña inicial"
                        type="password"
                        value={form.password}
                        onChange={updateField('password')}
                        error={errors.password}
                        helpText="Mínimo 6 caracteres."
                        required
                    />
                )}
            </form>
        </Modal>
    );
}

export default UserFormModal;
