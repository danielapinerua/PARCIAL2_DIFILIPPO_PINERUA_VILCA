PataSana: documentación completa
1. Objetivo
General: frontend web para gestionar una veterinaria chica: Appointments (turnos), Treatments (tratamientos), Payments (pagos) y Medical history (historial clínico), con acceso diferenciado por rol.
Específicos:
Que el Client (cliente) se registre, cargue sus Pets (mascotas) y pida Appointments (turnos) solo.
Que el personal gestione agenda, Treatments (tratamientos), atención y cobros desde la interfaz.
Que el Admin (administrador) vea métricas y balance de facturación.
Datos hardcodeados, persistidos en memoria/localStorage (sin API ni backend).
2. Roles
Role (Rol)
Cómo se obtiene
Alcance
client (cliente)
Registro público
Sus Pets (mascotas), Appointments (turnos), Treatments (tratamientos), Payments (pagos) e historial
veterinarian (veterinario)
Lo crea el admin
Su agenda, atención, Treatments (tratamientos) e historiales
receptionist (recepcionista)
Lo crea el admin
Gestiona Appointments (turnos) de todos y registra Payments (pagos)
admin (administrador)
Precargado
Todo, más usuarios y dashboard



3. Funcionalidades principales
Nº
Feature (Funcionalidad)
Descripción
F1
Appointments (Turnos)
Solicitar, confirmar, reprogramar, cancelar y marcar como realizado
F2
Treatments (Tratamientos)
Plan con N Appointments (turnos/sesiones) asignados a una Pet (mascota)
F3
Payments (Pagos) y balance
Pagos por Appointment (turno) realizado y balance facturado/cobrado/pendiente
F4
Medical history (Historial clínico)
Consulta cronológica de los Appointments (turnos) completados de una Pet (mascota)

4. Entidades y atributos
User (Usuario)
Attribute
Type
Descripción
id
Number
Identificador único (PK)
firstName
Text
Nombre
lastName
Text
Apellido
email
Text
Correo, único; se usa para el login
password
Text
Contraseña (en el mock, simulada)
phone
Text
Teléfono de contacto
role
Enum
client (cliente), veterinarian (veterinario), receptionist (recepcionista), admin (administrador)
active
Boolean
Si puede iniciar sesión

Pet (Mascota)
Attribute
Type
Descripción
id
Number
Identificador único (PK)
ownerId
Number
Dueño (FK → User)
name
Text
Nombre de la mascota
species
Enum
dog (perro), cat (gato), bird (ave), rodent (roedor), other (otro)
breed
Text
Raza
sex
Enum
male (macho), female (hembra)
birthDate
Date
Fecha de nacimiento, para calcular la edad
weight
Decimal
Último peso registrado (kg)
active
Boolean
Si está activa en el sistema

Treatment (Tratamiento)
Attribute
Type
Descripción
id
Number
Identificador único (PK)
petId
Number
Mascota tratada (FK → Pet)
veterinarianId
Number
Veterinario responsable (FK → User)
name
Text
Ej.: “Rehabilitación de cadera”
notes
Text
Observaciones generales del tratamiento
totalSessions
Number
Total de turnos (sesiones) planificados
startDate
Date
Fecha de inicio
status
Enum
active (activo), completed (finalizado), cancelled (cancelado)




Appointment (Turno)
Attribute
Type
Descripción
id
Number
Identificador único (PK)
petId
Number
Mascota a atender (FK → Pet)
veterinarianId
Number
Veterinario asignado (FK → User)
treatmentId
Number
Tratamiento al que pertenece (FK → Treatment); vacío si es consulta suelta
date
Date
Día del turno
time
Time
Horario (bloques de 30 min)
reason
Text
Motivo de la consulta o sesión
status
Enum
pending (pendiente), confirmed (confirmado), completed (realizado), cancelled (cancelado)
amount
Decimal
Importe a cobrar
notes
Text
Notas del turno; el veterinario las completa al atender y forman el historial clínico




Payment (Pago)
Attribute
Type
Descripción
id
Number
Identificador único (PK)
appointmentId
Number
Turno que se está pagando (FK → Appointment)
amount
Decimal
Importe abonado
method
Enum
cash (efectivo), transfer (transferencia), card (tarjeta)
date
Date
Fecha del pago
registeredById
Number
Usuario que lo registró (FK → User)

5. Relaciones
Relación
Cardinalidad
User (Usuario) con role client → Pet (Mascota)
1 a N
Pet (Mascota) → Appointment (Turno)
1 a N
Pet (Mascota) → Treatment (Tratamiento)
1 a N
Treatment (Tratamiento) → Appointment (Turno)
1 a N (el Appointment puede no tener Treatment)
User (Usuario) con role veterinarian → Appointment / Treatment
1 a N
Appointment (Turno) → Payment (Pago)
1 a N

Valores derivados (no se guardan):
Payment status (estado de pago) del Appointment (turno): suma de Payments (pagos) = 0 → unpaid (pendiente) · entre 0 y amount → partial (parcial) · igual a amount → paid (pagado).
Treatment progress (progreso del tratamiento): cantidad de Appointments (turnos) con status completed / totalSessions.
Medical history (historial clínico) de una Pet (mascota): Appointments (turnos) con status completed de esa Pet, ordenados por date descendente.
Client debt (deuda del cliente): suma de saldos (amount − Payments) de los Appointments (turnos) completed de sus Pets (mascotas).
6. Requerimientos funcionales
Usuarios y acceso
RF01. Registro público (solo crea User (usuario) con role client).
RF02. Login y logout con sesión persistente.
RF03. Rutas protegidas según role (rol).
RF04. El admin hace CRUD de Users (usuarios) (veterinarian, receptionist) y activa/desactiva cuentas con active (activo).
Mascotas
RF05. El client da de alta, edita y elimina sus Pets (mascotas).
RF06. El personal ve todas las Pets (mascotas).
Turnos
RF07. El client solicita Appointment (turno) eligiendo Pet (mascota), veterinarianId (veterinario), date (fecha), time (horario) libre y reason (motivo).
RF08. status (estados): pending → confirmed → completed | cancelled.
RF09. El receptionist confirma, reprograma o cancela cualquier Appointment (turno).
RF10. El veterinarian ve su agenda diaria/semanal.
RF11. El sistema no permite dos Appointments (turnos) al mismo veterinarianId en el mismo date y time.
RF12. Al marcar un Appointment (turno) como completed, el veterinarian completa notes (notas de la atención).
Tratamientos
RF13. El veterinarian crea un Treatment (tratamiento) para una Pet (mascota): name (nombre), notes (observaciones) y totalSessions (cantidad de sesiones).
RF14. El veterinarian agenda los Appointments (turnos) del Treatment, definiendo el amount (monto) de cada uno.
RF15. El Treatment pasa a completed (finalizado) cuando se realizaron todas sus sesiones.
RF16. El client ve el progreso (ej. 3/6 sesiones).
Pagos y balance
RF17. El receptionist registra Payments (pagos) con method (cash, transfer, card), totales o parciales, sobre Appointments (turnos) completed.
RF18. El client ve sus Appointments (turnos) realizados, Payments (pagos) y saldo adeudado.
RF19. El admin ve el balance: facturado, cobrado y pendiente, filtrable por período y por veterinarianId.
Historial clínico
RF20. Consulta del Medical history (historial clínico) de una Pet (mascota): date, veterinarianId, reason, notes y treatmentId si lo hay.
RF21. Filtros por rango de date (fechas) y por treatmentId (tratamiento).
RF22. veterinarian y admin ven cualquier historial; el client solo el de sus Pets (mascotas).
Dashboard (admin)
RF23. Indicadores: Appointments (turnos) del día/mes, ingresos del mes, Treatments (tratamientos) active (activos), deuda total, Pets (mascotas) registradas.
RF24. Gráficos de ingresos por mes y Appointments (turnos) por status (estado).
7. Requerimientos no funcionales
RNF01. React/Vite.
RNF02. UI en componentes reutilizables.
RNF03. Responsive (mobile/desktop).
RNF04. Validaciones de formularios con mensajes claros.
RNF05. Feedback visual (toasts, confirmación antes de eliminar).
RNF06. Datos mock en un módulo separado; persistencia en localStorage.
RNF07. Código, nombres de entidades, atributos y valores de enum en inglés.
8. Reglas de negocio
Usuarios y mascotas
RN01. El registro público solo crea Users (usuarios) con role client; el resto de roles los crea el admin.
RN02. El email es único por User (usuario).
RN03. Una Pet (mascota) pertenece a un único ownerId (dueño).
RN04. No se elimina una Pet (mascota) con Appointments (turnos) pending/confirmed ni Treatments (tratamientos) active.
RN05. Un User (usuario) con active (activo) en false no puede iniciar sesión pero conserva su historial.
Turnos
RN06. Un Appointment (turno) requiere petId, veterinarianId, date futura y horario libre.
RN07. El amount (monto) de un Appointment (turno) lo define el veterinarian al agendarlo.
RN08. Un Appointment (turno) completed no puede volver a otro status pero si puede eliminarse; solo el veterinarian que lo atendió edita sus notes.
RN09. Un Appointment (turno) cancelled no genera cobro.
Tratamientos
RN10. No se pueden agendar más Appointments (turnos) que totalSessions en un Treatment.
Pagos
RN11. La suma de Payments (pagos) de un Appointment (turno) no puede superar su amount (monto).
9. Casos de uso
Client (cliente)
CU01. Registrarse e iniciar sesión.
CU02. Gestionar mis Pets (mascotas).
CU03. Solicitar / cancelar Appointment (turno).
CU04. Ver mis Treatments (tratamientos) y su progreso.
CU05. Consultar el Medical history (historial clínico) de mi Pet (mascota).
CU06. Ver mis Payments (pagos) y saldo.
Receptionist (recepcionista)
CU07. Confirmar, reprogramar o cancelar Appointments (turnos).
CU08. Registrar Payment (pago) de un Appointment (turno).
CU09. Dar de alta un client y su Pet (mascota) en mostrador.
Veterinarian (veterinario)
CU10. Ver mi agenda.
CU11. Atender un Appointment (turno) y completar sus notes.
CU12. Crear Treatment (tratamiento) y agendar sus sesiones.
CU13. Consultar el Medical history (historial clínico) de cualquier Pet (mascota).
Admin (administrador)
CU14. Gestionar Users (usuarios) y role (roles).
CU15. Ver dashboard y balance de facturación.
CU16. Consultar cualquier Appointment (turno), Payment (pago) o historial.
Detalle de CU03: Solicitar turno
Actor: client. Precondición: logueado y con al menos una Pet (mascota).
Flujo principal: elige Pet → elige veterinarianId → elige date → ve horarios libres → elige time → indica reason → confirma → el Appointment (turno) queda pending.
Alternativos: sin horarios libres → sugerir otra date.
Postcondición: el Appointment es visible para client, receptionist y veterinarian.
Detalle de CU11: Atender turno
Actor: veterinarian. Precondición: Appointment (turno) confirmed del día.
Flujo principal: abre el Appointment → completa notes → marca completed.
Postcondición: el Appointment entra al Medical history (historial clínico) de la Pet (mascota) y queda disponible para cobro; si pertenece a un Treatment (tratamiento), avanza el progreso.

10. Orden de desarrollo sugerido
Login y roles → Pets (mascotas) → Appointments (turnos) → Medical history (historial, es una vista sobre Appointments) → Treatments (tratamientos) → Payments (pagos) → dashboard.

Vistas y acciones por rol
client (cliente)
View (Vista)
Ruta
Qué ve
Acciones
Home (Inicio)
/home
Próximos Appointments (turnos), Treatments (tratamientos) active con progreso y saldo adeudado
Acceso rápido a “Solicitar turno”
My Pets (Mis mascotas)
/pets
Lista de sus Pets (mascotas)
Crear, editar y eliminar Pet (RN04)
My Appointments (Mis turnos)
/appointments
Sus Appointments con status, filtrable por estado y fecha
Solicitar Appointment (CU03)
My Treatments (Mis tratamientos)
/treatments
Sus Treatments con progreso (ej. 3/6) y el detalle de sus Appointments
Solo lectura
Medical history (Historial clínico)
/history
Selector de Pet; línea de tiempo de Appointments completed con date, reason, notes
Filtrar por fechas y por Treatment (solo lectura)
My Payments (Mis pagos)
/payments
Appointments completed con amount, pagado, saldo y Payments (pagos) realizados
Solo lectura
Profile (Mi perfil)
/profile
Sus datos
Editar datos y cambiar password

receptionist (recepcionista)
View (Vista)
Ruta
Qué ve
Acciones
Home (Inicio)
/home
Appointments (turnos) del día y los que están pending (pendientes de confirmar)
Acceso rápido a confirmar
Appointments (Turnos)
/appointments
Todos los Appointments, filtrables por fecha, veterinarianId y status; vista calendario
Crear Appointment a nombre de un client, confirmar, reprogramar, cancelar
Clients and Pets (Clientes y mascotas)
/clients
Lista de Users con role client y sus Pets (mascotas)
Dar de alta client y Pet en mostrador (CU09), editar datos
Payments (Pagos)
/payments
Appointments completed con amount, pagado y saldo; historial de Payments
Registrar Payment (pago) (RN11)
Profile (Mi perfil)
/profile
Sus datos
Editar datos y cambiar password

veterinarian (veterinario)
View (Vista)
Ruta
Qué ve
Acciones
Home (Inicio)
/home
Su agenda del día y Treatments (tratamientos) active a su cargo
Acceso rápido a atender
My Schedule (Mi agenda)
/schedule
Sus Appointments (turnos) en vista diaria/semanal
Atender un Appointment confirmed: completar notes y marcarlo completed (CU11)
Treatments (Tratamientos)
/treatments
Treatments a su cargo con progreso
Crear Treatment, editar notes, agendar sus Appointments con amount (RF14), cancelar
Pets (Mascotas)
/pets
Todas las Pets con datos y owner (dueño)
Solo lectura
Medical history (Historial clínico)
/history
Historial de cualquier Pet (RF22)
Filtrar; editar notes de los Appointments que él mismo atendió (RN08)
Profile (Mi perfil)
/profile
Sus datos
Editar datos y cambiar password

admin (administrador)
View (Vista)
Ruta
Qué ve
Acciones
Dashboard (Panel)
/dashboard
Indicadores (RF23) y gráficos de ingresos y turnos por status (RF24)
Filtrar por período
Users (Usuarios)
/users
Todos los Users con role y active
Crear veterinarian y receptionist, editar, activar/desactivar (RF04)
Appointments (Turnos)
/appointments
Todos los Appointments
Consultar y aplicar cualquier acción de receptionist
Treatments (Tratamientos)
/treatments
Todos los Treatments
Solo lectura
Medical history (Historial clínico)
/history
Historial de cualquier Pet
Solo lectura
Payments and balance (Pagos y balance)
/payments
Balance (facturado, cobrado, pendiente) filtrable por período y veterinarianId; listado de Payments
Registrar Payment de ajuste
Profile (Mi perfil)
/profile
Sus datos
Editar datos y cambiar password


Componentes generales (common)
FormField
Explicación: envoltorio de campo de formulario: muestra el label, el contenido (un input, select, etc.), el mensaje de error y un texto de ayuda opcional. Evita repetir esa estructura en cada campo.
Props: label, error, helpText, required, children.
¿Usamos componentes reutilizables ya creados? No.
Input
Explicación: campo de entrada de una línea para texto, email, password, número, fecha y hora (type). Muestra el estado de error.
Props: label, type, value, onChange, error, placeholder, disabled, required.
¿Usamos componentes reutilizables ya creados? Sí
FormField: para mostrar label y mensaje de error.
Select
Explicación: lista desplegable de opciones (ej. species, method, veterinarianId).
Props: label, options ([{ value, label }]), value, onChange, error, placeholder, disabled.
¿Usamos componentes reutilizables ya creados? Sí
FormField: para label y error.
Textarea
Explicación: campo de texto multilínea (ej. notes, reason).
Props: label, value, onChange, rows, error, maxLength.
¿Usamos componentes reutilizables ya creados? Sí
FormField: para label y error.
Button
Explicación: botón con variantes visuales (primary, secondary, danger, ghost), estado de carga y deshabilitado.
Props: variant, size, loading, disabled, onClick, type, children.
¿Usamos componentes reutilizables ya creados? Sí
Spinner: para mostrar el indicador cuando loading es true.
Badge
Explicación: etiqueta pequeña de color para mostrar un valor corto (ej. rol, activo/inactivo).
Props: color (green, yellow, red, blue, gray), children.
¿Usamos componentes reutilizables ya creados? No.
Card
Explicación: contenedor con borde y sombra, con título, cuerpo y pie opcionales.
Props: title, footer, children, onClick.
¿Usamos componentes reutilizables ya creados? No.
Modal
Explicación: ventana emergente con fondo oscuro, título y botón de cierre; se cierra con Esc o al hacer clic afuera.
Props: isOpen, title, onClose, children, footer.
¿Usamos componentes reutilizables ya creados? Sí
Button: para el botón de cerrar y los botones del pie.
ConfirmDialog
Explicación: diálogo de confirmación para acciones destructivas o irreversibles (eliminar una Pet (mascota), cancelar un Appointment (turno), marcar completed).
Props: isOpen, title, message, confirmLabel, onConfirm, onCancel, danger.
¿Usamos componentes reutilizables ya creados? Sí
Modal: como ventana base.
Button: para “Confirmar” y “Cancelar”.
Table
Explicación: tabla genérica configurable por columnas, con soporte de columnas con render personalizado y columna de acciones.
Props: columns ([{ key, header, render }]), data, emptyMessage, onRowClick, loading.
¿Usamos componentes reutilizables ya creados? Sí
EmptyState: cuando data está vacío.
Spinner: mientras loading es true.
EmptyState
Explicación: mensaje para listas sin datos, con ícono, texto y acción opcional (ej. “Todavía no cargaste mascotas”).
Props: title, message, icon, action.
¿Usamos componentes reutilizables ya creados? No.
Spinner
Explicación: indicador de carga animado, usado mientras se resuelven las Promises de los services.
Props: size, label.
¿Usamos componentes reutilizables ya creados? No.
Toast / ToastProvider
Explicación: notificaciones flotantes de éxito, error e información (ej. “Turno solicitado”). ToastProvider guarda la cola de mensajes y expone el hook useToast() para dispararlos desde cualquier componente.
Props: ToastProvider: children. Toast: type, message, onClose.
¿Usamos componentes reutilizables ya creados? No.
ProgressBar
Explicación: barra de progreso con porcentaje y texto (ej. “3/6 sesiones” del Treatment (tratamiento)).
Props: value, max, label.
¿Usamos componentes reutilizables ya creados? No.
FilterBar
Explicación: fila contenedora de filtros con botón “Limpiar filtros”, usada por todos los listados filtrables.
Props: children, onClear.
¿Usamos componentes reutilizables ya creados? Sí
Button: para “Limpiar filtros”.
Calendar
Explicación: calendario genérico en vista mensual o semanal que dibuja eventos por día; no conoce la entidad, recibe eventos ya formateados.
Props: view (month, week), events ([{ id, date, time, title, color }]), onEventClick, onDayClick, currentDate.
¿Usamos componentes reutilizables ya creados? Sí
Button: para navegar entre períodos y cambiar de vista.

Paleta de colores
Concepto: una veterinaria transmite confianza y cuidado, pero también calidez. Por eso propongo un verde azulado (salud, limpieza) como color principal, un azul marino para dar estructura y un naranja suave para la calidez.
Paleta base
Rol
Nombre
Hex
Contraste con texto
Principal
Teal (verde azulado)
#0F766E
Blanco: 5,5:1 (cumple AA)
Secundario 1
Navy (azul marino)
#1E3A5F
Blanco: 11,5:1 (cumple AAA)
Secundario 2
Orange (naranja suave)
#F4A261
Negro: 8,5:1 (usar texto oscuro)
Blanco
White
#FFFFFF
Fondo base
Negro
Black
#111827
Texto principal

El naranja no cumple contraste con texto blanco, así que se usa solo como acento con texto negro, o como color sin texto (íconos, líneas, series de gráficos).
Dónde se usa cada color
Color
Uso en el sistema
Teal (principal)
Button variante primary, ítem activo de NavItem, links, foco de Input y Select, barra de ProgressBar, título de PageHeader
Navy (secundario 1)
Fondo de Sidebar y Navbar, Button variante secondary, encabezados de Table, títulos de Card
Orange (secundario 2)
Acentos: botón destacado de QuickActions (“Solicitar turno”), indicador del día actual en Calendar, segunda serie en gráficos, detalles decorativos en AuthLayout
White
Fondo de Card, Modal, Input y del área de contenido; texto sobre Sidebar y botones
Black
Texto del cuerpo, valores de StatCard, texto sobre el naranja

Proporción sugerida (60-30-10): 60 % blanco y neutros (fondos), 30 % navy y teal (estructura y acciones), 10 % naranja (acentos).
Variantes derivadas
No son colores nuevos, sino versiones más claras u oscuras de los anteriores para estados interactivos:
Variable
Hex
Uso
--color-primary-dark
#0B5D57
Hover de Button primary
--color-primary-light
#E6F2F0
Fondo de ítem activo, filas seleccionadas, fondo de la pantalla
--color-secondary-light
#E8EDF3
Hover de filas de Table, bordes suaves
--color-border
#D1D5DB
Bordes de Input, Card y Table
--color-text-muted
#6B7280
Texto secundario y placeholders

Colores de estado (fuera de la paleta de marca)
Los Badge usan colores semánticos que no forman parte de la identidad, para que “rojo = cancelado” se entienda sin leer. Se eligieron tonos que no se confunden con el teal ni con el naranja:
Color de Badge
Hex
Se usa en
green
#16A34A
Realizado, Finalizado, Pagado, Activo (usuario)
yellow
#CA8A04
Pendiente (turno), Parcial (pago)
blue
#2563EB
Confirmado, Activo (tratamiento)
red
#DC2626
Cancelado, Pendiente (pago), Button danger, errores
gray
#6B7280
Inactivo, valores neutros

Sugerencia de estilo para Badge: fondo claro del mismo tono (ej. #DCFCE7 para verde) y texto con el color base. Se lee mejor que un fondo sólido.
Implementación (variables CSS)
css
:root {
  /* Marca */
  --color-primary: #0F766E;
  --color-primary-dark: #0B5D57;
  --color-primary-light: #E6F2F0;
  --color-secondary: #1E3A5F;
  --color-secondary-light: #E8EDF3;
  --color-accent: #F4A261;

  /* Base */
  --color-white: #FFFFFF;
  --color-black: #111827;
  --color-text-muted: #6B7280;
  --color-border: #D1D5DB;

  /* Estados */
  --color-success: #16A34A;
  --color-warning: #CA8A04;
  --color-info: #2563EB;
  --color-danger: #DC2626;
}
Los componentes usan siempre var(--color-primary) y similares, nunca el hex directo. Así, si el grupo decide cambiar un color, se modifica en un solo lugar.

