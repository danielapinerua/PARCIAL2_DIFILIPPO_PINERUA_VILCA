# PataSana — Clínica Veterinaria

> Sistema web de gestión para una clínica veterinaria: turnos, mascotas, tratamientos, historial clínico, pagos y usuarios, con vistas diferenciadas por rol.

**Trabajo Integrador — Parcial 2** · Di Filippo · Piñerua · Vilca

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/private-true-gray)]()

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Credenciales de demostración](#credenciales-de-demostración)
- [Roles y control de acceso](#roles-y-control-de-acceso)
- [Mapa de rutas](#mapa-de-rutas)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Capa de datos y mocks](#capa-de-datos-y-mocks)
- [Modelo de datos](#modelo-de-datos)
- [Sistema de diseño y componentes](#sistema-de-diseño-y-componentes)
- [Autenticación](#autenticación)
- [Convenciones y buenas prácticas](#convenciones-y-buenas-prácticas)
- [Flujo de trabajo con Git](#flujo-de-trabajo-con-git)
- [Build y despliegue](#build-y-despliegue)
- [Limitaciones conocidas y deuda técnica](#limitaciones-conocidas-y-deuda-técnica)
- [Autores](#autores)

---

## Descripción general

**PataSana** es una Single Page Application (SPA) para la gestión integral de una clínica veterinaria. Cubre cuatro perfiles de usuario:

| Rol | Descripción |
|---|---|
| `client` | Cliente (dueño de mascota): gestiona sus mascotas, turnos, tratamientos, historial y pagos. |
| `veterinarian` | Veterinario: agenda (vista calendario), tratamientos y sesiones, mascotas e historial clínico. |
| `receptionist` | Recepción: panel de turnos, clientes, pagos y agenda con FullCalendar. |
| `admin` | Administrador: panel de control, usuarios, turnos, tratamientos, historial, pagos y balance. |

La aplicación funciona en **dos modos de datos**, conmutados por variable de entorno:

- **Modo mock** (por defecto): las `api.js` de cada feature resuelven contra fixtures JSON en `mocks/`, hidratadas en `localStorage`. Ideal para desarrollo y demo sin backend.
- **Modo API**: las `api.js` ejecutan `fetch` contra una API REST real (los endpoints esperados están documentados en JSDoc dentro de cada `api.js`).

---

## Stack tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| UI | React | ^19.3.1 |
| Bundler / dev server | Vite | ^8.3.4 |
| Routing | react-router-dom | ^7.18.5 |
| Calendario | @fullcalendar/react | ^7.1.4 |
| Fechas | temporal-polyfill | ^1.0.8 |
| Linting | oxlint | ^1.88.0 |
| React Compiler | babel-plugin-react-compiler + @rolldown/plugin-babel | ^1.0.0 |
| Plugin React | @vitejs/plugin-react | ^6.1.2 |

Notas relevantes:

- **React Compiler** habilitado vía `babel-plugin-react-compiler` (ver `vite.config.js`).
- **JavaScript** con `jsconfig.json` (sin TypeScript; `checkJs: false`).
- **Alias de imports** `@` → `src/` configurado en `vite.config.js` y `jsconfig.json`.
- Estilos con **CSS plano y colocalizado** por componente (sin CSS-in-JS ni frameworks).

---

## Requisitos previos

- **Node.js** 20.19+ o 22.12+ (requerido por Vite 8). Se recomienda la versión LTS vigente.
- **npm** (el proyecto usa `package-lock.json`; no usar yarn/pnpm para mantener reproducibilidad).
- Git.

## Instalación y puesta en marcha

```bash
# 1. Clonar el repositorio
git clone https://github.com/danielapinerua/PARCIAL2_DIFILIPPO_PINERUA_VILCA.git
cd PARCIAL2_DIFILIPPO_PINERUA_VILCA

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env        # Linux / macOS
copy .env.example .env      # Windows (cmd)
Copy-Item .env.example .env # Windows (PowerShell)

# 4. Levantar el servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:5173` (puerto por defecto de Vite).

## Variables de entorno

Definidas en `.env` (ignorado por git) a partir de `.env.example`:

| Variable | Valores | Default | Descripción |
|---|---|---|---|
| `VITE_API_READY` | `'true'` / cualquier otro | `false` | Solo el string exacto `true` activa el modo API (fetch contra REST). Cualquier otro valor usa los mocks. |

> Las variables con prefijo `VITE_` se exponen al cliente. Nunca colocar secretos en ellas.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run lint` | Análisis estático con oxlint (reglas de React y oxc). |

---

## Credenciales de demostración

Usuarios precargados en `src/features/users/mocks/users.json` (contraseña para todos: `123456`):

| Email | Contraseña | Rol | Nombre |
|---|---|---|---|
| `cliente@patasana.com` | `123456` | `client` | Daniela Piñerua |
| `veterinario@patasana.com` | `123456` | `veterinarian` | Marcos Di Filippo |
| `recepcion@patasana.com` | `123456` | `receptionist` | Gianluca Vilca |
| `admin@patasana.com` | `123456` | `admin` | Admin PataSana |

Tras el login, el admin es redirigido a `/dashboard` y el resto a `/home`.

> ⚠️ Las contraseñas de los mocks están en texto plano y **solo** son válidas para el modo mock/demo. En modo API la autenticación la resuelve el backend.

---

## Roles y control de acceso

El acceso se controla en dos niveles:

1. **Autenticación**: `ProtectedRoute` (`src/features/auth/ProtectedRoute.jsx`) verifica que exista sesión; si no, redirige a `/login`.
2. **Autorización por rol**: `ProtectedRoute` recibe `allowedRoles`; si el rol del usuario no está incluido, redirige a `/home`.

Además, varias rutas usan un **componente de despacho por rol** definido en `App.jsx` (`AppointmentsRoute`, `PetsRoute`, `TreatmentsRoute`, `HistoryRoute`, `PaymentsRoute`) que renderiza la página correspondiente según `user.role`.

## Mapa de rutas

| Ruta | Página | Roles permitidos |
|---|---|---|
| `/` | Redirige a `/login` | pública |
| `/login` | `Login` | pública |
| `/home` | `RoleHome` (despacha por rol) | client, veterinarian, receptionist, admin |
| `/dashboard` | `AdminHomePage` | admin |
| `/schedule` | `Scheduler` (FullCalendar) | veterinarian, receptionist |
| `/pets` | `ClientPetsPage` / `VetPetsPage` | client, veterinarian |
| `/appointments` | `ClientAppointmentsPage` / `ReceptionistAppointmentsPage` / `AdminAppointmentsPage` | client, receptionist, admin |
| `/treatments` | `ClientTreatmentsPage` / `VetTreatmentsPage` / `AdminTreatmentsPage` | client, veterinarian, admin |
| `/treatments/:treatmentId` | `TreatmentDetailPage` | client, veterinarian, admin |
| `/history` | `ClientHistoryPage` / `VetHistoryPage` / `AdminHistoryPage` | client, veterinarian, admin |
| `/payments` | `ClientPaymentsPage` / `ReceptionistPaymentsPage` / `AdminPaymentsPage` | client, receptionist, admin |
| `/profile` | `ProfilePage` | todos los roles |
| `/users` | `AdminUsersPage` | admin |
| `/clients` | `ReceptionistClientsPage` | receptionist |
| `*` | 404 (`<h1>Página no encontrada - 404</h1>`) | — |

---

## Arquitectura del proyecto

El código sigue una **arquitectura por features** (feature-based): cada dominio funcional vive en `src/features/<feature>/` y encapsula sus `api.js`, componentes, mocks, estilos, constantes y un **barrel export** (`index.js`) que define la API pública del feature. Las capas compartidas viven en `src/components/` (sistema de diseño) y `src/utils/`.

```
PARCIAL2_DIFILIPPO_PINERUA_VILCA/
├── index.html                  # Entry HTML (lang="es", meta description, título)
├── vite.config.js              # Plugins React + React Compiler, alias @ → src/
├── jsconfig.json               # IntelliSense y paths @/* para el editor
├── .oxlintrc.json              # Configuración de oxlint (react + oxc)
├── .env.example                # Plantilla de variables de entorno
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                # createRoot + StrictMode, importa variables.css y global.css
    ├── App.jsx                 # Router, providers (Auth, Toast) y despacho por rol
    ├── css/
    │   ├── variables.css       # Design tokens (paleta, tipografía, espaciado)
    │   └── global.css          # Reset y estilos base
    ├── utils/
    │   └── dates.js            # toISODate, daysFromToday, hydrateDateOffset
    ├── components/             # Sistema de diseño compartido (CSS colocalizado)
    │   ├── AppLayout/          # Shell: skip-link, Sidebar + Navbar + <main>
    │   ├── Sidebar/            # Navegación lateral (drawer off-canvas < 768px)
    │   ├── Navbar/             # Barra superior (usuario, rol, logout)
    │   ├── NavItem/            # Ítem de navegación (íconos SVG inline por ruta)
    │   ├── BrandMark/          # Isologo de PataSana
    │   ├── Button/  Card/  Badge/  Input/  Select/  Textarea/  FormField/
    │   ├── Modal/  ConfirmDialog/  Toast/ (+ ToastProvider, ToastContext, useToast)
    │   ├── Table/  StatCard/  ProgressBar/  FilterBar/  EmptyState/  Spinner/
    │   ├── PageHeader/
    └── features/               # Dominio funcional, un directorio por feature
        ├── auth/               # Login, AuthContext, ProtectedRoute, api.login
        ├── home/               # RoleHome + homes por rol (client/vet/recep/admin)
        ├── pets/               # Mascotas (cliente ve las suyas, vet las activas)
        ├── appointments/       # Turnos, Scheduler (FullCalendar), utils de slots
        ├── treatments/         # Tratamientos, sesiones, TreatmentDetailPage, constants
        ├── history/            # Historial clínico (deriva de turnos/tratamientos)
        ├── payments/           # Pagos y balance
        ├── users/              # Gestión de usuarios y clientes
        └── profile/            # Perfil y cambio de contraseña
```

### Estructura interna de un feature

```
features/<feature>/
├── index.js            # Barrel export: API pública del feature
├── api.js              # Acceso a datos (mocks + localStorage o fetch REST)
├── constants.js        # (opcional) Constantes, metadatos de roles, formatters
├── utils.js            # (opcional) Lógica de dominio pura
├── mocks/              # Fixtures JSON (solo modo mock)
└── components/         # Páginas y componentes del feature (+ .css colocalizado)
```

**Regla clave:** los componentes nunca acceden a `localStorage` ni al JSON directamente; siempre consumen el `api.js` de su feature, que decide el modo de datos.

---

## Capa de datos y mocks

### Patrón `api.js`

Cada feature expone funciones async con la misma forma: primero evalúan `VITE_API_READY`; en modo mock leen/escriben `localStorage` (con fallback al JSON de `mocks/`); en modo API ejecutan `fetch` al endpoint correspondiente y normalizan errores con mensajes en español.

| Feature | Clave de `localStorage` | Endpoints REST esperados (modo API) |
|---|---|---|
| `users` | `patasana_users` | `GET/POST /users`, `PATCH /users/:id`, `POST /users/:id/password` |
| `auth` | — (login lee `users`) | `POST /auth/login` |
| `pets` | `patasana_pets` | `GET/POST /pets`, `PATCH/DELETE /pets/:id` |
| `appointments` | `patasana_appointments` | `GET/POST /appointments`, `PATCH /appointments/:id` |
| `treatments` | `patasana_treatments` | `GET/POST /treatments`, `PATCH /treatments/:id` |
| `payments` | `patasana_payments` (solo lectura) | `GET /payments` |

### Hidratación de fechas relativas

Los fixtures guardan **offsets en días** (`dateOffsetDays`, `startDateOffsetDays`) en lugar de fechas absolutas. Al cargar, `hydrateDateOffset()` (`src/utils/dates.js`) los convierte a fechas ISO relativas a "hoy", de modo que la demo siempre muestre datos vigentes sin tocar los JSON. Los tratamientos creados en runtime ya persisten `startDate` directamente (ver `getTreatmentStartDate` en `features/treatments/constants.js` para la compatibilidad con ambos formatos).

### Persistencia en modo mock

`pets`, `appointments`, `treatments` y `users` **persisten** los cambios en `localStorage`, por lo que las altas/modificaciones sobreviven a recargas. Los usuarios se pueden crear, editar y activar/desactivar desde `/users`; la agenda de recepción también persiste los turnos que crea. Los pagos, en cambio, se leen de `mocks/payments.json` (solo lectura). Para volver al estado original del fixture: borrar las claves `patasana_*` en DevTools → Application → Local Storage.

---

## Modelo de datos

Entidades principales (campos de los fixtures):

**User** — `id`, `firstName`, `lastName`, `email` (único, regla RN02), `password`, `phone`, `role`, `active`

**Pet** — `id`, `ownerId` (→ User), `name`, `species` (`dog`/`cat`/…), `breed`, `sex`, `birthDate`, `weight`, `active`

**Appointment** — `id`, `petId` (→ Pet), `veterinarianId` (→ User), `treatmentId` (→ Treatment | null), `date`, `time`, `reason`, `status` (`pending`/`confirmed`/`completed`/`cancelled`), `amount`, `notes`

**Treatment** — `id`, `petId` (→ Pet), `veterinarianId` (→ User), `name`, `notes`, `totalSessions`, `startDate`, `status` (`active`/`completed`/`cancelled`)

**Payment** — `id`, `appointmentId` (→ Appointment), `amount`, `method` (`cash`/`transfer`/`card`), `date`, `registeredById` (→ User)

**Historial clínico** — no tiene entidad propia: se **deriva** de `appointments` (turnos realizados/completados) y `treatments` por mascota. `history` no tiene `api.js`; las páginas componen datos desde los demás features.

### Lógica de dominio destacada

- **Slots de turnos** (`features/appointments/utils.js`): bloques de 30 min de 09:00 a 17:30 (`TIME_SLOTS`); `getFreeSlots()` excluye los turnos del veterinario (salvo cancelados) y, si la fecha es hoy, los horarios ya pasados. El importe base de una consulta del cliente es `DEFAULT_AMOUNT` ($10.000).
- **Agenda de recepción** (`Scheduler` + `NewAppointmentModal`): recepción puede crear turnos confirmados desde la vista Día/Semana o con el botón “Nuevo turno”. Se validan fecha, horario libre, solapamientos y campos; el turno se persiste con `createAppointment` y queda visible en `/appointments` y en la agenda del veterinario.
- **Estados y metadatos de rol** (`features/treatments/constants.js`): `TREATMENT_STATUS`, `APPOINTMENT_STATUS`, `ROLE_META` (etiqueta, color, prefijo `Dr. ` para veterinarios), `getDisplayName()`, `formatDate()` (DD/MM/YYYY), `formatCurrency()` (`$` con separador `es-AR`).

---

## Sistema de diseño y componentes

Tokens centralizados en `src/css/variables.css`; reset y base en `global.css`. Cada componente del sistema de diseño vive en `src/components/<Name>/` con su `.jsx` y su `.css` colocalizados.

Componentes disponibles: `AppLayout`, `Sidebar`, `Navbar`, `NavItem`, `BrandMark`, `PageHeader`, `Button`, `Card`, `Badge`, `StatCard`, `Table`, `ProgressBar`, `Input`, `Select`, `Textarea`, `FormField`, `FilterBar`, `Modal`, `ConfirmDialog`, `Toast` (+ `ToastProvider`, `useToast`), `EmptyState`, `Spinner`.

Características transversales:

- **Accesibilidad**: skip-link a `#main-content`, `aria-label`s en botones de ícono, foco programado al abrir el drawer móvil y en el cierre con `Escape`, `role="alert"` en errores de formulario, `inert` sobre el contenido cuando el drawer está abierto.
- **Feedback**: sistema de **toasts** vía contexto (`ToastProvider` + `useToast`) en lugar de `alert()`.
- **Responsive**: sidebar fijo en desktop; drawer off-canvas con overlay por debajo de 768px (`matchMedia` en `AppLayout`).
- **Íconos**: SVG inline definidos en `Sidebar.jsx` (`ICON_PATHS`), con auto-selección según la ruta (`ICON_BY_ROUTE`).

---

## Autenticación

- El estado de sesión vive en `AuthContext` (React Context) **en memoria**: sobrevive a re-renders pero **no** a recargas de página (no se persiste en `localStorage` ni cookies).
- `login()` (modo mock) valida credenciales contra `users.json`/`localStorage`, verifica `active` y devuelve el usuario **sin la contraseña**. En modo API hace `POST /auth/login` con el mismo contrato.
- `ProtectedRoute` redirige a `/login` sin sesión y a `/home` con rol no autorizado.
- `AuthProvider` y `ToastProvider` envuelven al `BrowserRouter` en `App.jsx`; el orden de providers es `AuthProvider → ToastProvider → BrowserRouter`.

---

## Convenciones y buenas prácticas

- **Feature-based architecture**: cada dominio es autocontenido y expone su API pública por `index.js` (barrel). Los imports externos siempre usan el barrel (`@/features/pets`), nunca rutas internas del feature.
- **Alias `@`** para `src/` en imports (configurado en Vite y jsconfig); evitar imports relativos profundos (`../../../`).
- **JSDoc** en funciones de `api.js` y componentes clave (parámetros, retornos, comportamiento en ambos modos).
- **Manejo de errores uniforme**: `try/catch` en las páginas, `Spinner` mientras carga, `EmptyState` para colecciones vacías, toasts para feedback de acciones.
- **Nomenclatura**: componentes `PascalCase`, hooks `useX`, constantes `UPPER_SNAKE_CASE`, archivos de feature en `camelCase`, handlers `handleX`.
- **i18n**: UI íntegramente en español (rioplatense en textos de error), `lang="es"` en `index.html`.
- **Fechas**: formato ISO `YYYY-MM-DD` como contrato de datos; formato local `DD/MM/YYYY` solo en presentación (`formatDate`).
- **Sin mutaciones de estado directo**: actualizaciones inmutables; IDs nuevos calculados con `max(id) + 1` en modo mock.
- **Linting**: oxlint con `react/rules-of-hooks: error` y `react/only-export-components: warn`.
- **React Compiler**: habilitado; evitar patrones que el compilador marque (muta sión de props, etc.).
- **`.gitignore`** protege `.env` (solo `.env.example` se versiona) y `dist/`; **`.gitattributes`** normaliza LF (`* text=auto`).
- **CSS**: tokens en `variables.css`, nada de valores mágicos repetidos; estilos colocalizados, sin fugas entre features.

---

## Flujo de trabajo con Git

- **Repositorio**: [danielapinerua/PARCIAL2_DIFILIPPO_PINERUA_VILCA](https://github.com/danielapinerua/PARCIAL2_DIFILIPPO_PINERUA_VILCA)
- **Rama principal**: `main`; trabajo integrado vía merges de ramas personales y PRs directos sobre `main`.
- **Mensajes de commit**: estilo *conventional commits* (`feat:`, `feat(scope):`, `refactor(data):`, `fix:`), mayoritariamente en español. Ejemplos reales:

  ```
  feat: add receptionist appointment scheduling from calendar
  feat(tratamientos): agregar detalle de tratamiento y gestión de sesiones
  refactor(data): migra mocks a JSON y organiza la arquitectura por features
  feat: configurar autenticación y rutas iniciales
  ```

- **Autoría**: Marcos Di Filippo, Daniela Piñerua y Gianluca Vilca (ver historial con `git log --format="%an <%ae>"`).

---

## Build y despliegue

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ en local para verificación
```

El build es estático: puede desplegarse en cualquier hosting de SPAs (Vercel, Netlify, GitHub Pages, S3+CDN). Para rutas internas como `/treatments/:id`, configurar el servidor para que **todas las rutas resuelvan a `index.html`** (fallback SPA). No se incluyen variables `VITE_*` sensibles en el bundle más allá de la flag `VITE_API_READY`.

---

## Limitaciones conocidas y deuda técnica

Documentadas para su tratamiento futuro, no ocultas:

1. **Sin tests**: no hay framework de testing ni cobertura configurada.
2. **Sesión no persistente**: recargar la página cierra la sesión (el contexto vive en memoria).
3. **Contraseñas en texto plano** en los mocks y en `localStorage` (solo aceptable en demo).
4. **`payments` es de solo lectura** en modo mock; no existe `createPayment` aunque la UI de recepción/admin contempla balance.
5. **Modo API sin backend**: `VITE_API_READY=true` espera endpoints REST que no están incluidos en este repo; las rutas van con path relativo (`/appointments`, etc.) y requieren reverse proxy o `server.proxy` en Vite.
6. **Sin paginación** en tablas ni virtualización; aceptable con el volumen de datos de la demo.
7. **Duplicación entre las páginas `*HistoryPage`**: la lógica de filtrado está repetida entre los tres roles y podría extraerse a hooks compartidos (`useClinicalHistory`).
8. **Fechas hidratadas en cada carga**: los offsets se resuelven una vez al importar el módulo; los IDs de turnos de sesiones creadas desde detalle de tratamiento no se cruzan automáticamente con `payments`.

## Hoja de ruta sugerida

- [ ] Persistir sesión (token en `sessionStorage`/cookie httpOnly con backend real)
- [ ] Tests unitarios de `utils`/`api` (Vitest + Testing Library)
- [ ] Backend REST propio o integración con API de la cátedra (`VITE_API_READY=true`)
- [ ] Paginación y búsqueda server-side en tablas de admin
- [ ] Página 403 y manejo unificado de errores de rutas
- [ ] Extracción de la lógica de historial a un hook compartido

---

## Autores

| Nombre | Autor en commits |
|---|---|
| Marcos Di Filippo | `Marcos Di Filippo` / `marcosDiFilippo` |
| Daniela Piñerua | `danielapinerua` |
| Gianluca Vilca | `gvilca` |

Repositorio: [danielapinerua/PARCIAL2_DIFILIPPO_PINERUA_VILCA](https://github.com/danielapinerua/PARCIAL2_DIFILIPPO_PINERUA_VILCA)

**Parcial 2 — Desarrollo Web** · Instituto Da Vinci.
