import { useState } from 'react'
import AppLayout from '@/components/AppLayout/AppLayout'
import Badge from '@/components/Badge/Badge'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog'
import EmptyState from '@/components/EmptyState/EmptyState'
import FilterBar from '@/components/FilterBar/FilterBar'
import Input from '@/components/Input/Input'
import Modal from '@/components/Modal/Modal'
import PageHeader from '@/components/PageHeader/PageHeader'
import ProgressBar from '@/components/ProgressBar/ProgressBar'
import Select from '@/components/Select/Select'
import Spinner from '@/components/Spinner/Spinner'
import StatCard from '@/components/StatCard/StatCard'
import Table from '@/components/Table/Table'
import Textarea from '@/components/Textarea/Textarea'
import useToast from '@/components/Toast/useToast'
import './HomePage.css'

const ICON_PATHS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="6.5" r="2" />
      <circle cx="17" cy="6.5" r="2" />
      <circle cx="4" cy="13" r="2" />
      <circle cx="20" cy="13" r="2" />
      <path d="M8.5 19c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5-1.6 2.5-3.5 2.5-3.5-.5-3.5-2.5Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  alert: (
    <>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  box: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5M12 13v9" />
    </>
  ),
}

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

const SIDEBAR_ITEMS = [
  { href: '#inicio', label: 'Inicio', icon: <Icon name="home" />, isActive: true },
  { href: '#acciones', label: 'Botones', icon: <Icon name="check" /> },
  { href: '#formularios', label: 'Formularios', icon: <Icon name="user" /> },
  { href: '#datos', label: 'Datos', icon: <Icon name="chart" /> },
  { href: '#notificaciones', label: 'Notificaciones', icon: <Icon name="info" /> },
]

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Perro' },
  { value: 'cat', label: 'Gato' },
  { value: 'bird', label: 'Ave' },
  { value: 'rodent', label: 'Roedor' },
  { value: 'other', label: 'Otro' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Realizado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const TABLE_COLUMNS = [
  { key: 'pet', header: 'Mascota' },
  { key: 'owner', header: 'Dueño' },
  { key: 'species', header: 'Especie' },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => <Badge color={row.statusColor}>{row.status}</Badge>,
  },
  { key: 'nextVisit', header: 'Próximo turno' },
]

const TABLE_ROWS = [
  {
    id: 1,
    pet: 'Luna',
    owner: 'María Pérez',
    species: 'Perra',
    status: 'Confirmado',
    statusColor: 'blue',
    nextVisit: 'Hoy · 09:00',
  },
  {
    id: 2,
    pet: 'Milo',
    owner: 'Jorge Díaz',
    species: 'Gato',
    status: 'Pendiente',
    statusColor: 'yellow',
    nextVisit: 'Hoy · 11:30',
  },
  {
    id: 3,
    pet: 'Toby',
    owner: 'Lucía Fernández',
    species: 'Perro',
    status: 'Realizado',
    statusColor: 'green',
    nextVisit: 'Ayer · 15:00',
  },
  {
    id: 4,
    pet: 'Nala',
    owner: 'Sofía Ramírez',
    species: 'Gata',
    status: 'Cancelado',
    statusColor: 'red',
    nextVisit: 'Sin programar',
  },
]

function HomePage() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dangerOpen, setDangerOpen] = useState(false)
  const [tableMode, setTableMode] = useState('data')
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [formValues, setFormValues] = useState({
    owner: '',
    email: '',
    password: '',
    date: '',
    species: '',
    notes: '',
    errorEmail: '',
    errorSpecies: '',
    errorNotes: '',
  })

  const updateForm = (field) => (event) => {
    const { value } = event.target
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  const updateFilter = (field) => (event) => {
    const { value } = event.target
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({ search: '', status: '' })
    toast.info('Filtros limpiados.')
  }

  return (
    <AppLayout
      sidebarItems={SIDEBAR_ITEMS}
      userName="Laura Giménez"
      roleLabel="Administradora"
      roleColor="blue"
      onLogout={() => toast.info('Sesión cerrada (demostración).')}
    >
      <div className="home" id="inicio">
        <PageHeader
          title="PataSana · Biblioteca de componentes"
          subtitle="Vista de demostración con datos de ejemplo. Cada sección muestra los componentes genéricos que usaremos en el sistema de la clínica."
          actions={
            <>
              <Button onClick={() => setModalOpen(true)}>Nuevo turno</Button>
              <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
                Confirmar turno
              </Button>
            </>
          }
        />

        <section id="acciones" className="home__section">
          <Card title="Botones">
            <div className="home__groups">
              <div>
                <h3 className="home__group-title">Variantes</h3>
                <div className="home__row">
                  <Button>Principal</Button>
                  <Button variant="secondary" onClick={() => toast.info('Acción secundaria.')}>
                    Secundario
                  </Button>
                  <Button variant="danger" onClick={() => toast.error('Acción destructiva.')}>
                    Peligro
                  </Button>
                  <Button variant="ghost" onClick={() => toast.info('Acción fantasma.')}>
                    Fantasma
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="home__group-title">Tamaños</h3>
                <div className="home__row">
                  <Button size="sm">Pequeño</Button>
                  <Button size="md">Mediano</Button>
                  <Button size="lg">Grande</Button>
                </div>
              </div>

              <div>
                <h3 className="home__group-title">Estados</h3>
                <div className="home__row">
                  <Button loading>Guardando…</Button>
                  <Button disabled>Deshabilitado</Button>
                  <Button variant="secondary" loading>
                    Cargando…
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section id="etiquetas" className="home__section">
          <Card title="Etiquetas">
            <div className="home__groups">
              <div>
                <h3 className="home__group-title">Colores de estado</h3>
                <div className="home__row">
                  <Badge color="green">Realizado</Badge>
                  <Badge color="yellow">Pendiente</Badge>
                  <Badge color="red">Cancelado</Badge>
                  <Badge color="blue">Confirmado</Badge>
                  <Badge color="gray">Inactivo</Badge>
                </div>
              </div>
              <div>
                <h3 className="home__group-title">Roles</h3>
                <div className="home__row">
                  <Badge color="blue">Administrador</Badge>
                  <Badge color="green">Veterinario</Badge>
                  <Badge color="yellow">Recepción</Badge>
                  <Badge color="gray">Cliente</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section id="formularios" className="home__section">
          <Card title="Formularios">
            <div className="home__groups">
              <div>
                <h3 className="home__group-title">Estado normal</h3>
                <div className="home__form-grid">
                  <Input
                    label="Responsable"
                    value={formValues.owner}
                    onChange={updateForm('owner')}
                    placeholder="Nombre y apellido"
                    helpText="Tal como figura en el sistema."
                    required
                  />
                  <Input
                    label="Correo electrónico"
                    type="email"
                    value={formValues.email}
                    onChange={updateForm('email')}
                    placeholder="nombre@correo.com"
                  />
                  <Input
                    label="Contraseña"
                    type="password"
                    value={formValues.password}
                    onChange={updateForm('password')}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <Input
                    label="Fecha del turno"
                    type="date"
                    value={formValues.date}
                    onChange={updateForm('date')}
                  />
                  <Select
                    label="Especie"
                    options={SPECIES_OPTIONS}
                    value={formValues.species}
                    onChange={updateForm('species')}
                    placeholder="Seleccioná una especie"
                    required
                  />
                  <Textarea
                    label="Observaciones"
                    value={formValues.notes}
                    onChange={updateForm('notes')}
                    maxLength={140}
                    placeholder="Motivo de la consulta"
                  />
                </div>
              </div>

              <div>
                <h3 className="home__group-title">Estado con error</h3>
                <div className="home__form-grid">
                  <Input
                    label="Correo electrónico"
                    type="email"
                    value={formValues.errorEmail}
                    onChange={updateForm('errorEmail')}
                    error="Ingresá un correo válido."
                    required
                  />
                  <Select
                    label="Especie"
                    options={SPECIES_OPTIONS}
                    value={formValues.errorSpecies}
                    onChange={updateForm('errorSpecies')}
                    placeholder="Seleccioná una especie"
                    error="La especie es obligatoria."
                    required
                  />
                  <Textarea
                    label="Observaciones"
                    value={formValues.errorNotes}
                    onChange={updateForm('errorNotes')}
                    error="Las observaciones no pueden superar los 140 caracteres."
                    maxLength={140}
                  />
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section id="tarjetas" className="home__section">
          <Card title="Tarjetas">
            <div className="home__groups">
              <div className="home__grid home__grid--three">
                <StatCard
                  label="Turnos del mes"
                  value="148"
                  icon={<Icon name="clock" />}
                  trend="+12% vs. mes anterior"
                  trendDirection="up"
                />
                <StatCard
                  label="Ingresos del mes"
                  value="$1.240.000"
                  icon={<Icon name="card" />}
                  trend="+8% vs. mes anterior"
                  trendDirection="up"
                />
                <StatCard
                  label="Tratamientos activos"
                  value="12"
                  icon={<Icon name="paw" />}
                  trend="Sin cambios"
                  trendDirection="flat"
                />
              </div>

              <div className="home__grid home__grid--two">
                <Card
                  title="Card con pie"
                  footer={
                    <Button variant="ghost" size="sm" onClick={() => toast.info('Acción del pie.')}>
                      Ver detalle
                    </Button>
                  }
                >
                  <p className="home__text">
                    Contenedor genérico con título, cuerpo y pie opcionales. No conoce entidades
                    del dominio.
                  </p>
                </Card>
                <Card title="Card clickeable" onClick={() => toast.success('Card seleccionada.')}>
                  <p className="home__text">
                    Al recibir <code>onClick</code> se comporta como un botón: responde a Enter y
                    Espacio y muestra foco visible.
                  </p>
                </Card>
              </div>
            </div>
          </Card>
        </section>

        <section id="progreso" className="home__section">
          <Card title="Progreso y estados">
            <div className="home__groups">
              <div>
                <h3 className="home__group-title">Barras de progreso</h3>
                <div className="home__form-grid">
                  <ProgressBar value={3} max={6} label="3/6 sesiones" />
                  <ProgressBar value={1} max={4} label="1/4 sesiones" />
                  <ProgressBar value={6} max={6} label="Tratamiento finalizado" />
                  <ProgressBar value={0} max={8} label="Sin sesiones" />
                </div>
              </div>

              <div>
                <h3 className="home__group-title">Indicadores de carga</h3>
                <div className="home__row">
                  <Spinner size="sm" label="Cargando (chico)" />
                  <Spinner size="md" label="Cargando (mediano)" />
                  <Spinner size="lg" label="Cargando (grande)" />
                </div>
              </div>

              <div>
                <h3 className="home__group-title">Estado vacío</h3>
                <EmptyState
                  title="Todavía no cargaste mascotas"
                  message="Cuando agregues una mascota vas a verla acá con sus turnos y su historial."
                  icon={<Icon name="paw" size={24} />}
                  action={
                    <Button onClick={() => toast.success('Acción del estado vacío.')}>
                      Agregar mascota
                    </Button>
                  }
                />
              </div>
            </div>
          </Card>
        </section>

        <section id="datos" className="home__section">
          <Card title="Filtros y tabla">
            <div className="home__groups">
              <FilterBar onClear={clearFilters}>
                <Input
                  label="Buscar"
                  value={filters.search}
                  onChange={updateFilter('search')}
                  placeholder="Mascota o dueño"
                />
                <Select
                  label="Estado"
                  options={STATUS_OPTIONS}
                  value={filters.status}
                  onChange={updateFilter('status')}
                  placeholder="Todos los estados"
                />
              </FilterBar>

              <div className="home__row">
                <Button
                  variant={tableMode === 'data' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTableMode('data')}
                >
                  Con datos
                </Button>
                <Button
                  variant={tableMode === 'empty' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTableMode('empty')}
                >
                  Vacía
                </Button>
                <Button
                  variant={tableMode === 'loading' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTableMode('loading')}
                >
                  Cargando
                </Button>
              </div>

              <Table
                columns={TABLE_COLUMNS}
                data={tableMode === 'data' ? TABLE_ROWS : []}
                loading={tableMode === 'loading'}
                emptyMessage="No hay turnos que coincidan con los filtros."
                onRowClick={(row) => toast.info(`Seleccionaste a ${row.pet}.`)}
              />
            </div>
          </Card>
        </section>

        <section id="notificaciones" className="home__section">
          <Card title="Diálogos y notificaciones">
            <div className="home__groups">
              <div>
                <h3 className="home__group-title">Diálogos</h3>
                <div className="home__row">
                  <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
                  <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
                    Confirmar turno
                  </Button>
                  <Button variant="danger" onClick={() => setDangerOpen(true)}>
                    Cancelar turno
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="home__group-title">Toasts</h3>
                <div className="home__row">
                  <Button onClick={() => toast.success('Turno solicitado correctamente.')}>
                    Toast de éxito
                  </Button>
                  <Button variant="danger" onClick={() => toast.error('No se pudo guardar el pago.')}>
                    Toast de error
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => toast.info('Recordatorio: revisá la agenda del día.')}
                  >
                    Toast de información
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <Modal
        isOpen={modalOpen}
        title="Nuevo turno"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false)
                toast.success('Cambios guardados.')
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="home__stack">
          <p className="home__text">
            Este modal es un componente genérico: recibe título, cuerpo y pie. Se cierra con
            Escape o haciendo clic fuera del panel.
          </p>
          <Input label="Motivo de la consulta" value="" onChange={() => {}} placeholder="Control anual" />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirmar turno"
        message="El turno de Luna quedará confirmado para hoy a las 09:00. ¿Querés continuar?"
        confirmLabel="Confirmar turno"
        onConfirm={() => {
          setConfirmOpen(false)
          toast.success('Turno confirmado correctamente.')
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={dangerOpen}
        title="Cancelar turno"
        message="Esta acción cancelará el turno y notificará al cliente. No se puede deshacer."
        confirmLabel="Sí, cancelar"
        danger
        onConfirm={() => {
          setDangerOpen(false)
          toast.info('Turno cancelado. Se notificó al cliente.')
        }}
        onCancel={() => setDangerOpen(false)}
      />
    </AppLayout>
  )
}

export default HomePage
