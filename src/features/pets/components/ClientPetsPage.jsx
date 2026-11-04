import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getAppointments } from '@/features/appointments';
import { getTreatments } from '@/features/treatments';
import { getPets, createPet, updatePet, deletePet } from '../api';
import AppLayout from '@/components/AppLayout/AppLayout';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import EmptyState from '@/components/EmptyState/EmptyState';
import Input from '@/components/Input/Input';
import Modal from '@/components/Modal/Modal';
import PageHeader from '@/components/PageHeader/PageHeader';
import Select from '@/components/Select/Select';
import Table from '@/components/Table/Table';
import useToast from '@/components/Toast/useToast';
import './ClientPetsPage.css';

const SIDEBAR_ITEMS = [
    { href: '/home', label: 'Inicio' },
    { href: '/pets', label: 'Mis mascotas', isActive: true },
    { href: '/appointments', label: 'Mis turnos' },
    { href: '/treatments', label: 'Mis tratamientos' },
    { href: '/history', label: 'Historial clínico' },
    { href: '/payments', label: 'Mis pagos' },
    { href: '/profile', label: 'Mi perfil' },
];

const SPECIES = { dog: 'Perro', cat: 'Gato', bird: 'Ave', rodent: 'Roedor', other: 'Otro' };
const SEX = { male: 'Macho', female: 'Hembra' };

const toOptions = (map) => Object.entries(map).map(([value, label]) => ({ value, label }));

const EMPTY_FORM = { name: '', species: '', breed: '', sex: '', birthDate: '', weight: '' };

const getAge = (birthDate) => {
    const birth = new Date(birthDate);
    const now = new Date();
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) months -= 1;
    if (months < 12) return `${Math.max(months, 0)} meses`;
    const years = Math.floor(months / 12);
    return years === 1 ? '1 año' : `${years} años`;
};

// RNF04: validaciones con mensajes claros
const validate = (form) => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Ingresá el nombre de la mascota.';
    if (!form.species) errors.species = 'Elegí la especie.';
    if (!form.sex) errors.sex = 'Elegí el sexo.';
    if (!form.birthDate) {
        errors.birthDate = 'Ingresá la fecha de nacimiento.';
    } else if (new Date(form.birthDate) > new Date()) {
        errors.birthDate = 'La fecha de nacimiento no puede ser futura.';
    }
    if (form.weight === '') {
        errors.weight = 'Ingresá el peso.';
    } else if (Number(form.weight) <= 0) {
        errors.weight = 'El peso tiene que ser mayor a 0.';
    }
    return errors;
};

function ClientPetsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [toDelete, setToDelete] = useState(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [allPets, allAppointments, allTreatments] = await Promise.all([
                getPets(),
                getAppointments(),
                getTreatments(),
            ]);
            // RN03: el cliente solo ve sus mascotas
            setPets(allPets.filter((p) => p.ownerId === user.id));
            setAppointments(allAppointments);
            setTreatments(allTreatments);
            setLoadError('');
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // RN04: no se elimina con turnos pendientes/confirmados ni tratamientos activos
    const getDeleteBlockReason = (pet) => {
        const hasOpenAppointments = appointments.some(
            (a) => a.petId === pet.id && (a.status === 'pending' || a.status === 'confirmed')
        );
        if (hasOpenAppointments) {
            return `${pet.name} tiene turnos pendientes o confirmados. Cancelalos antes de eliminarla.`;
        }
        const hasActiveTreatment = treatments.some(
            (t) => t.petId === pet.id && t.status === 'active'
        );
        if (hasActiveTreatment) {
            return `${pet.name} tiene un tratamiento activo y no se puede eliminar.`;
        }
        return null;
    };

    const openCreate = () => {
        setEditingPet(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setFormOpen(true);
    };

    const openEdit = (pet) => {
        setEditingPet(pet);
        setForm({
            name: pet.name,
            species: pet.species,
            breed: pet.breed ?? '',
            sex: pet.sex,
            birthDate: pet.birthDate,
            weight: String(pet.weight),
        });
        setErrors({});
        setFormOpen(true);
    };

    const closeForm = () => setFormOpen(false);

    const updateField = (field) => (e) => {
        setForm((current) => ({ ...current, [field]: e.target.value }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    const handleSave = async () => {
        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            name: form.name.trim(),
            species: form.species,
            breed: form.breed.trim(),
            sex: form.sex,
            birthDate: form.birthDate,
            weight: Number(form.weight),
        };

        try {
            setSaving(true);
            if (editingPet) {
                await updatePet(editingPet.id, payload);
                toast.success(`Datos de ${payload.name} actualizados.`);
            } else {
                await createPet({ ...payload, ownerId: user.id, active: true });
                toast.success(`${payload.name} se agregó a tus mascotas.`);
            }
            closeForm();
            await loadData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (pet) => {
        const reason = getDeleteBlockReason(pet);
        if (reason) {
            toast.error(reason);
            return;
        }
        setToDelete(pet);
    };

    const handleDelete = async () => {
        try {
            await deletePet(toDelete.id);
            toast.success(`${toDelete.name} se eliminó de tus mascotas.`);
            setToDelete(null);
            await loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const columns = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => (
                <span className="client-pets__name">
                    {row.name}
                    {!row.active && <Badge color="gray">Inactiva</Badge>}
                </span>
            ),
        },
        { key: 'species', header: 'Especie', render: (row) => SPECIES[row.species] },
        { key: 'breed', header: 'Raza', render: (row) => row.breed || '—' },
        { key: 'sex', header: 'Sexo', render: (row) => SEX[row.sex] },
        { key: 'age', header: 'Edad', render: (row) => getAge(row.birthDate) },
        { key: 'weight', header: 'Peso', render: (row) => `${row.weight} kg` },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <div className="client-pets__actions">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                        Editar
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row)}>
                        Eliminar
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout
            sidebarItems={SIDEBAR_ITEMS}
            userName={`${user.firstName} ${user.lastName}`}
            roleLabel="Cliente"
            roleColor="gray"
            onLogout={handleLogout}
        >
            <div className="client-pets">
                <PageHeader
                    title="Mis mascotas"
                    subtitle="Cargá y mantené actualizados los datos de tus mascotas."
                    actions={<Button onClick={openCreate}>Agregar mascota</Button>}
                />

                <Card>
                    {loadError ? (
                        <EmptyState
                            title="No se pudieron cargar tus mascotas"
                            message={loadError}
                            action={<Button onClick={loadData}>Reintentar</Button>}
                        />
                    ) : !loading && pets.length === 0 ? (
                        <EmptyState
                            title="Todavía no cargaste mascotas"
                            message="Agregá tu primera mascota para poder pedirle turnos."
                            action={<Button onClick={openCreate}>Agregar mascota</Button>}
                        />
                    ) : (
                        <Table columns={columns} data={pets} loading={loading} />
                    )}
                </Card>
            </div>

            <Modal
                isOpen={formOpen}
                title={editingPet ? `Editar a ${editingPet.name}` : 'Agregar mascota'}
                onClose={closeForm}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeForm} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} loading={saving}>
                            {editingPet ? 'Guardar cambios' : 'Agregar mascota'}
                        </Button>
                    </>
                }
            >
                <div className="client-pets__form">
                    <Input
                        label="Nombre"
                        value={form.name}
                        onChange={updateField('name')}
                        error={errors.name}
                        required
                    />
                    <Select
                        label="Especie"
                        options={toOptions(SPECIES)}
                        value={form.species}
                        onChange={updateField('species')}
                        placeholder="Elegí una especie"
                        error={errors.species}
                    />
                    <Input
                        label="Raza"
                        value={form.breed}
                        onChange={updateField('breed')}
                        placeholder="Opcional"
                    />
                    <Select
                        label="Sexo"
                        options={toOptions(SEX)}
                        value={form.sex}
                        onChange={updateField('sex')}
                        placeholder="Elegí el sexo"
                        error={errors.sex}
                    />
                    <Input
                        label="Fecha de nacimiento"
                        type="date"
                        value={form.birthDate}
                        onChange={updateField('birthDate')}
                        error={errors.birthDate}
                        required
                    />
                    <Input
                        label="Peso (kg)"
                        type="number"
                        value={form.weight}
                        onChange={updateField('weight')}
                        error={errors.weight}
                        required
                    />
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                title="Eliminar mascota"
                message={
                    toDelete
                        ? `Se va a eliminar a ${toDelete.name} de tus mascotas. Esta acción no se puede deshacer.`
                        : ''
                }
                confirmLabel="Sí, eliminar"
                danger
                onConfirm={handleDelete}
                onCancel={() => setToDelete(null)}
            />
        </AppLayout>
    );
}

export default ClientPetsPage;