# Arquitectura del proyecto

Documento de referencia para entender cómo está organizado el sistema, qué responsabilidad tiene cada capa y cómo se convive con dos orígenes de datos: **mocks locales** y **API real**.

> Estado actual: la aplicación funciona con datos mock por defecto. La API real todavía no existe; los `api.js` ya tienen preparado el camino para usarla cuando se active la variable de entorno correspondiente.

---

## 1. Resumen general

El proyecto es una aplicación React + Vite. No tiene backend propio ni base de datos. Los datos pueden venir de dos lugares:

1. **Modo mock:** archivos JSON dentro de cada feature, persistidos en `localStorage`.
2. **Modo API:** peticiones `fetch` contra una API HTTP.

La decisión entre un modo y otro vive **dentro de cada `api.js`** y se controla con una única variable de entorno:

```bash
VITE_API_READY=true|false
```

Los componentes **no saben** de dónde vienen los datos. Solo importan funciones desde el `index.js` de cada feature.

---

## 2. Estructura de carpetas

```text
.
├── .env                          # Configuración local (ignorada por Git)
├── .env.example                  # Plantilla versionada de variables de entorno
├── .gitignore
├── jsconfig.json
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx                   # Rutas y providers principales
    ├── main.jsx                  # Punto de entrada de React
    ├── components/               # UI compartida, sin lógica de dominio
    │   ├── AppLayout/
    │   ├── Badge/
    │   ├── Button/
    │   ├── Card/
    │   ├── ConfirmDialog/
    │   ├── EmptyState/
    │   ├── FilterBar/
    │   ├── FormField/
    │   ├── Input/
    │   ├── Modal/
    │   ├── Navbar/
    │   ├── NavItem/
    │   ├── PageHeader/
    │   ├── ProgressBar/
    │   ├── Select/
    │   ├── Sidebar/
    │   ├── Spinner/
    │   ├── StatCard/
    │   ├── Table/
    │   ├── Textarea/
    │   └── Toast/
    ├── css/                      # Variables y estilos globales
    ├── features/
    │   ├── appointments/
    │   │   ├── api.js
    │   │   ├── index.js
    │   │   └── mocks/
    │   │       └── appointments.json
    │   ├── auth/
    │   │   ├── api.js
    │   │   ├── AuthContext.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── index.js
    │   │   └── components/
    │   │       ├── Login.jsx
    │   │       └── Login.css
    │   ├── home/
    │   │   ├── index.js
    │   │   └── components/
    │   │       ├── RoleHome.jsx
    │   │       ├── ClientHomePage.jsx
    │   │       ├── VetHomePage.jsx
    │   │       └── ReceptionistHomePage.jsx
    │   ├── payments/
    │   │   ├── api.js
    │   │   ├── index.js
    │   │   └── mocks/
    │   │       └── payments.json
    │   ├── pets/
    │   │   ├── api.js
    │   │   ├── index.js
    │   │   ├── components/       # Se completará cuando exista la página
    │   │   └── mocks/
    │   │       └── pets.json
    │   ├── treatments/
    │   │   ├── api.js
    │   │   ├── index.js
    │   │   └── mocks/
    │   │       └── treatments.json
    │   └── users/
    │       ├── api.js
    │       ├── index.js
    │       └── mocks/
    │           └── users.json
    └── utils/
        └── dates.js
```

### Carpetas que ya no existen

- `src/data/`: los mocks se movieron a `features/<feature>/mocks/`.
- `src/services/storage.js`: la persistencia y el acceso a datos viven ahora en cada `api.js`.
- `src/contexts/`: `AuthContext` y `ProtectedRoute` se movieron a `features/auth/`.
- `src/components/Login/`: `Login` se movió a `features/auth/components/`.

---

## 3. Responsabilidades por capa

| Capa | Responsabilidad | No debe hacer |
|---|---|---|
| `src/components/` | Componentes visuales reutilizables: botones, tablas, modales, inputs, layout. | Conocer entidades del dominio, `fetch`, JSON o `localStorage`. |
| `src/features/<feature>/components/` | Componentes propios de una feature: páginas, formularios, tablas específicas. | Importar JSON directamente, usar `fetch` o `localStorage`. |
| `src/features/<feature>/api.js` | Única puerta de entrada a los datos de la feature. Decide entre mock y API, lee/escribe `localStorage` o hace `fetch`. | Renderizar JSX, conocer componentes o rutas. |
| `src/features/<feature>/mocks/*.json` | Datos de prueba de la feature. | Ser importados por componentes. |
| `src/features/<feature>/index.js` | API pública de la feature: reexporta sus componentes y funciones de `api.js`. | Contener lógica. |
| `src/features/auth/` | Login, sesión en memoria, rutas protegidas y autenticación. | Ser importado por `users` (la dependencia va en un solo sentido: `auth -> users`). |
| `src/utils/dates.js` | Utilidades de fecha, incluida la hidratación de offsets de los mocks. | Conocer entidades o componentes. |
| `src/App.jsx` | Providers y rutas. | Acceder datos directamente. |

### Regla de dependencias

```text
componentes de una feature
        │
        ▼
feature/index.js  ──────►  feature/api.js  ──────►  mocks/*.json
                                      │
                                      └──────────►  API HTTP (fetch)

componentes compartidos de src/components  ◄── solo props y eventos
```

Reglas concretas:

1. Un componente **nunca** importa `fetch`, `localStorage`, un JSON o un `api.js` de otra feature directamente.
2. Para consumir otra feature, se importa desde su `index.js`:

   ```js
   import { getAppointments, updateAppointment } from '@/features/appointments';
   ```

3. Dentro de la misma feature se permiten imports relativos:

   ```js
   import { login } from '../api';
   ```

4. `api.js` puede importar otro `api.js` si la dependencia es clara. Hoy solo ocurre en `auth/api.js`, que usa `getUsers` de `users/api.js` para el login mock.
5. Los JSON de `mocks/` solo los importa el `api.js` de esa feature.

---

## 4. Anatomía de una feature

Cada feature sigue el mismo patrón:

```text
features/pets/
├── api.js          # Funciones async: getPets, createPet, updatePet, deletePet
├── index.js        # export { ... } from './api' y componentes
├── components/     # Componentes propios (cuando existan)
└── mocks/
    └── pets.json   # Datos de prueba
```

### 4.1 `api.js`

Cada `api.js` sigue esta estructura:

```js
import petsMock from './mocks/pets.json';

const API_READY = import.meta.env.VITE_API_READY === 'true';
const STORAGE_KEY = 'patasana_pets';

export async function getPets() {
    if (!API_READY) {
        // Modo mock: JSON o localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : petsMock;
    }

    // Modo API
    const response = await fetch('/pets');
    if (!response.ok) throw new Error('No se pudieron obtener las mascotas.');
    return response.json();
}
```

Puntos importantes:

- Todas las funciones son `async`, incluso en modo mock. Los componentes siempre las consumen con `await` o `.then()`.
- La constante `API_READY` se evalúa una sola vez por módulo.
- Solo el string exacto `"true"` activa la API. Cualquier otro valor, o la variable ausente, usa mocks.
- En modo API, si `response.ok` es falso se lanza un `Error`. Los componentes muestran ese mensaje con `EmptyState` o `toast.error`.

### 4.2 `index.js`

Es la API pública de la feature. Oculta si los datos vienen de `api.js`, de un mock o de la API.

```js
// src/features/pets/index.js
export { createPet, deletePet, getPets, updatePet } from './api';
```

Cuando existan componentes propios, también se exportan acá:

```js
export { default as PetsPage } from './components/PetsPage';
```

Esto permite que el resto del sistema importe siempre desde la feature y no desde archivos internos.

---

## 5. Funciones disponibles por feature

### `users`

| Función | Modo mock | Modo API |
|---|---|---|
| `getUsers()` | Lee `mocks/users.json` o `patasana_users` de `localStorage`. | `GET /users` |

### `auth`

| Función | Modo mock | Modo API |
|---|---|---|
| `login(email, password)` | Busca el usuario en `users`, valida `password` y `active`, y devuelve el usuario sin contraseña. | `POST /auth/login` con `{ email, password }`. Devuelve el usuario sin contraseña. |

### `pets`

| Función | Modo mock | Modo API |
|---|---|---|
| `getPets()` | Lee `mocks/pets.json` o `patasana_pets`. | `GET /pets` |
| `createPet(pet)` | Genera el próximo `id` y guarda en `patasana_pets`. | `POST /pets` |
| `updatePet(id, changes)` | Modifica y guarda en `patasana_pets`. | `PATCH /pets/:id` |
| `deletePet(id)` | Filtra y guarda en `patasana_pets`. | `DELETE /pets/:id` |

### `appointments`

| Función | Modo mock | Modo API |
|---|---|---|
| `getAppointments()` | Lee `mocks/appointments.json` o `patasana_appointments`. | `GET /appointments` |
| `updateAppointment(id, changes)` | Modifica y guarda en `patasana_appointments`. | `PATCH /appointments/:id` |

### `treatments`

| Función | Modo mock | Modo API |
|---|---|---|
| `getTreatments()` | Lee `mocks/treatments.json` o `patasana_treatments`. | `GET /treatments` |
| `updateTreatment(id, changes)` | Modifica y guarda en `patasana_treatments`. | `PATCH /treatments/:id` |

### `payments`

| Función | Modo mock | Modo API |
|---|---|---|
| `getPayments()` | Lee `mocks/payments.json` o `patasana_payments`. | `GET /payments` |

---

## 6. Flujo de datos

### 6.1 Modo mock (`VITE_API_READY=false`)

```text
Componente
   │  await getAppointments()
   ▼
features/appointments/index.js
   │
   ▼
features/appointments/api.js
   │
   ├── ¿Hay datos en localStorage?
   │       sí ──► devuelve lo guardado
   │       no ──► devuelve mocks/appointments.json
   │
   ▼
Componente recibe el array y renderiza
```

- No hay tráfico de red.
- La primera lectura usa el JSON.
- Las mutaciones escriben en `localStorage`.
- Al recargar, se mantienen los cambios guardados.
- Los datos persisten por navegador, no entre dispositivos.

### 6.2 Modo API (`VITE_API_READY=true`)

```text
Componente
   │  await getAppointments()
   ▼
features/appointments/index.js
   │
   ▼
features/appointments/api.js
   │
   ▼
fetch('/appointments')
   │
   ├── response.ok = false ──► throw Error ──► componente muestra error
   │
   └── response.ok = true  ──► response.json() ──► componente renderiza
```

- No se lee ni escribe `localStorage`.
- Los datos viven en el backend.
- Los IDs, fechas y estados los define la API.
- El frontend no debe asumir que el backend devuelve exactamente el mismo shape que los mocks; si cambia algo, se ajusta el `api.js` correspondiente.

---

## 7. Persistencia en modo mock

Cada `api.js` usa la misma clave histórica de `localStorage`:

| Feature | Clave |
|---|---|
| `users` | `patasana_users` |
| `pets` | `patasana_pets` |
| `appointments` | `patasana_appointments` |
| `treatments` | `patasana_treatments` |
| `payments` | `patasana_payments` |

### Reglas

1. **No cambiar las claves.** Si se renombran, se pierden los datos guardados de los usuarios existentes.
2. Si la clave no existe, se usa el JSON de `mocks/`.
3. Si la clave existe, se usa lo guardado, aunque el JSON haya cambiado.
4. Para probar datos nuevos desde cero, borrar las claves `patasana_*` desde DevTools → Application → Local Storage.
5. En modo API estas claves no se usan.

### Cantidad de datos iniciales

| Entidad | Registros |
|---|---:|
| Usuarios | 4 |
| Mascotas | 10 |
| Tratamientos | 6 |
| Turnos | 44 |
| Pagos | 25 |

---

## 8. Fechas relativas en los mocks

Los mocks originales usaban `daysFromToday()`. Un JSON no puede ejecutar código, así que los archivos guardan offsets en días:

```json
{
  "id": 30,
  "dateOffsetDays": 0,
  "time": "09:00",
  "reason": "Control anual"
}
```

| Archivo | Campo de offset | Campo resultante |
|---|---|---|
| `appointments.json` | `dateOffsetDays` | `date` |
| `treatments.json` | `startDateOffsetDays` | `startDate` |
| `payments.json` | `dateOffsetDays` | `date` |

La conversión se hace con `hydrateDateOffset` en `src/utils/dates.js`:

```js
hydrateDateOffset(items, offsetKey, dateKey)
```

Cada `api.js` hidrata su JSON **una sola vez al cargar el módulo**. Así la aplicación sigue mostrando turnos de “hoy”, “ayer” o “la semana que viene” sin guardar fechas absolutas en el repositorio.

En modo API esto no aplica: la API devuelve fechas ya resueltas.

---

## 9. Autenticación

### Archivos

```text
features/auth/
├── api.js              # login()
├── AuthContext.jsx     # usuario en memoria + login/logout
├── ProtectedRoute.jsx  # protección de rutas por rol
├── components/Login.jsx
└── index.js
```

### Flujo de login

1. `Login.jsx` llama a `login(email, password)` de `features/auth/api.js`.
2. En modo mock:
   - Lee los usuarios desde `users/api.js`.
   - Busca por email y contraseña.
   - Rechaza usuarios inexistentes o inactivos.
   - Devuelve el usuario sin el campo `password`.
3. En modo API:
   - Hace `POST /auth/login` con `{ email, password }`.
   - Si la respuesta no es OK, lanza un error genérico de credenciales.
   - Devuelve el usuario sin `password`.
4. `Login.jsx` guarda el usuario con `login()` de `AuthContext` y navega:
   - `admin` → `/dashboard`
   - resto → `/home`

### Importante

- La sesión vive **en memoria**. Al recargar la página se pierde y se vuelve a `/login`. Esto ya era así antes del refactor.
- `ProtectedRoute` es una protección de experiencia de usuario, no de seguridad. En modo API, la autorización real debe hacerla el backend.
- El login mock usa los usuarios de `mocks/users.json`, que incluyen contraseñas de prueba. No usar credenciales reales en ese archivo.

---

## 10. Variables de entorno

### 10.1 Archivos

```text
.env               # configuración local, ignorada por Git
.env.example       # plantilla versionada
```

`.env.example`:

```bash
# Origen de datos de la aplicación.
#
# true  -> las api.js de cada feature usan fetch contra la API real.
# false -> las api.js de cada feature devuelven el JSON de mocks/.
#
# Solo el string "true" activa el modo API. Cualquier otro valor usa mocks.
VITE_API_READY=false
```

### 10.2 Nombre y semántica

| Variable | Valores | Efecto |
|---|---|---|
| `VITE_API_READY` | `"true"` | Activa `fetch` en todos los `api.js`. |
| `VITE_API_READY` | `"false"` o ausente | Usa los JSON de `mocks/` y `localStorage`. |

La comparación es estricta:

```js
const API_READY = import.meta.env.VITE_API_READY === 'true';
```

Por eso `TRUE`, `1`, `yes` o `" true "` **no** activan la API.

### 10.3 Por qué el prefijo `VITE_`

Vite solo expone al navegador las variables de entorno que empiezan con `VITE_`. Una variable como `API_READY` no sería visible desde el código del frontend.

### 10.4 Cómo se instala y configura

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo local `.env` a partir de la plantilla.

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Bash / macOS / Linux:

   ```bash
   cp .env.example .env
   ```

   Si `.env` ya existe, no hace falta volver a crearlo.

3. Dejar el modo mock para desarrollo local:

   ```bash
   VITE_API_READY=false
   ```

4. Levantar la aplicación:

   ```bash
   npm run dev
   ```

5. Para probar contra una API real:

   ```bash
   VITE_API_READY=true
   ```

   y reiniciar el servidor de desarrollo. Vite lee las variables al arrancar; cambiar `.env` en caliente no alcanza.

### 10.5 Cómo interfiere en el sistema

| Aspecto | `VITE_API_READY=false` | `VITE_API_READY=true` |
|---|---|---|
| Origen de datos | `mocks/*.json` + `localStorage` | API HTTP |
| Persistencia | Navegador | Backend |
| Login | Valida contra `users.json` | `POST /auth/login` |
| Fechas | Se hidratan desde offsets | Las devuelve la API |
| Red | No hay `fetch` | Hay `fetch` |
| Errores | Fallback a mock | `throw` si `!response.ok` |
| Datos entre dispositivos | No | Sí |
| Requiere backend | No | Sí |

El cambio es **global**: una sola variable afecta a todas las features. No hay flags por feature.

### 10.6 Cuándo activar `VITE_API_READY=true`

Solo cuando existan **todos** los endpoints que consumen las pantallas actuales:

```text
GET   /users
POST  /auth/login
GET   /pets
GET   /appointments
PATCH /appointments/:id
GET   /treatments
PATCH /treatments/:id
GET   /payments
```

Si se activa con endpoints faltantes, las pantallas que los usan van a mostrar error, aunque las demás sigan funcionando con la API.

### 10.7 Si la API está en otro origen

Las llamadas actuales son relativas:

```js
fetch('/pets');
```

Eso funciona si la API está en el mismo origen que el frontend o detrás de un proxy.

Si la API corre en otro puerto u otro dominio, hay dos opciones:

1. Configurar un proxy en `vite.config.js`.
2. Agregar una variable `VITE_API_URL` y usarla en los `api.js`:

   ```js
   const API_URL = import.meta.env.VITE_API_URL ?? '';
   fetch(`${API_URL}/pets`);
   ```

`VITE_API_URL` **no** está implementada todavía. Si se agrega, debe documentarse también en `.env.example`.

### 10.8 Build de producción

El valor de `VITE_API_READY` se inyecta en tiempo de build. Un build hecho con `true` espera una API real; un build hecho con `false` funciona como demo con mocks.

Recomendación:

- Para entregas/demos sin backend: `VITE_API_READY=false`.
- Para producción con backend: `VITE_API_READY=true` y verificar todos los endpoints.

---

## 11. Impacto del refactor por módulo

| Módulo | Estado actual | Responsabilidad |
|---|---|---|
| `src/App.jsx` | Modificado | Importa `AuthProvider`, `Login`, `ProtectedRoute` y `RoleHome` desde las features. |
| `src/features/auth/AuthContext.jsx` | Movido | Guarda el usuario logueado en memoria. |
| `src/features/auth/ProtectedRoute.jsx` | Movido | Redirige según sesión y rol. |
| `src/features/auth/components/Login.jsx` | Movido y modificado | Login asíncrono contra `auth/api.js`. |
| `src/features/auth/api.js` | Nuevo | `login()` mock/API. |
| `src/features/users/api.js` | Nuevo | `getUsers()` mock/API. |
| `src/features/pets/api.js` | Nuevo | `getPets`, `createPet`, `updatePet`, `deletePet`. |
| `src/features/appointments/api.js` | Nuevo | `getAppointments`, `updateAppointment`. |
| `src/features/treatments/api.js` | Nuevo | `getTreatments`, `updateTreatment`. |
| `src/features/payments/api.js` | Nuevo | `getPayments`. |
| `src/features/home/components/ClientHomePage.jsx` | Modificado | Carga asíncrona; muestra deuda, turnos y tratamientos. |
| `src/features/home/components/VetHomePage.jsx` | Modificado | Carga asíncrona; atiende turnos y finaliza tratamientos. |
| `src/features/home/components/ReceptionistHomePage.jsx` | Modificado | Carga asíncrona; confirma turnos. |
| `src/utils/dates.js` | Modificado | Agrega `hydrateDateOffset`. |
| `src/data/*.js` | Eliminados | Reemplazados por `features/*/mocks/*.json`. |
| `src/services/storage.js` | Eliminado | Su lógica se distribuyó en cada `api.js`. |
| `jsconfig.json` | Modificado | `resolveJsonModule: true` para el editor. |
| `.env` / `.env.example` | Nuevos | Configuración del origen de datos. |
| `.gitignore` | Modificado | Ignora `.env` y `.env.local`, conserva `.env.example`. |
| `package.json` | Sin cambios | Vite ya soporta imports de JSON. |
| `vite.config.js` | Sin cambios | No se agregó proxy ni variable de API. |
| `documentacion.md` | Sin cambios | Sigue siendo la especificación funcional. |

---

## 12. Datos y contratos

### `users.json`

```json
{
  "id": 1,
  "firstName": "Daniela",
  "lastName": "Piñerua",
  "email": "cliente@patasana.com",
  "password": "123456",
  "phone": "1155550001",
  "role": "client",
  "active": true
}
```

Roles posibles: `client`, `veterinarian`, `receptionist`, `admin`.

### `pets.json`

```json
{
  "id": 1,
  "ownerId": 1,
  "name": "Luna",
  "species": "dog",
  "breed": "Labrador",
  "sex": "female",
  "birthDate": "2019-04-12",
  "weight": 28.5,
  "active": true
}
```

### `appointments.json` (mock)

```json
{
  "id": 1,
  "petId": 1,
  "veterinarianId": 2,
  "treatmentId": null,
  "dateOffsetDays": -120,
  "time": "09:00",
  "reason": "Vacunación anual",
  "status": "completed",
  "amount": 9000,
  "notes": "Se aplica vacuna séxtuple."
}
```

En la aplicación, `dateOffsetDays` se transforma en `date` (`YYYY-MM-DD`).

Estados: `pending`, `confirmed`, `completed`, `cancelled`.

### `treatments.json` (mock)

```json
{
  "id": 1,
  "petId": 3,
  "veterinarianId": 2,
  "name": "Rehabilitación de cadera",
  "notes": "Fisioterapia semanal.",
  "totalSessions": 6,
  "startDateOffsetDays": -21,
  "status": "active"
}
```

En la aplicación, `startDateOffsetDays` se transforma en `startDate`.

### `payments.json` (mock)

```json
{
  "id": 1,
  "appointmentId": 1,
  "amount": 9000,
  "method": "cash",
  "dateOffsetDays": -120,
  "registeredById": 3
}
```

Métodos: `cash`, `transfer`, `card`.

---

## 13. Cómo agregar una feature nueva

Checklist:

1. Crear la carpeta:

   ```text
   src/features/<nombre>/
   ├── api.js
   ├── index.js
   ├── components/
   └── mocks/
       └── <nombre>.json
   ```

2. Implementar en `api.js`:
   - `const API_READY = import.meta.env.VITE_API_READY === 'true';`
   - La clave de `localStorage` si aplica.
   - Las funciones `async` de lectura/escritura.
   - La rama mock y la rama `fetch`.

3. Exportar la API pública en `index.js`.

4. Consumir desde los componentes:

   ```js
   import { getAlgo } from '@/features/<nombre>';
   ```

5. No importar el JSON ni `localStorage` desde componentes.

6. Si la entidad tiene fechas relativas, guardar offsets en el JSON y usar `hydrateDateOffset`.

7. Verificar con `VITE_API_READY=false` y, si hay backend, con `VITE_API_READY=true`.

---

## 14. Cómo agregar una función a un `api.js` existente

Ejemplo: agregar `cancelAppointment`.

1. Agregar la función en `src/features/appointments/api.js`.
2. Implementar la rama mock (leer, modificar, guardar).
3. Implementar la rama API (`PATCH` o el método que corresponda).
4. Reexportarla en `src/features/appointments/index.js`.
5. Consumirla desde el componente con `await`.

No cambia nada más: ni el componente sabe si es mock o API, ni hay que tocar otros `api.js`.

---

## 15. Verificación y comandos

```bash
# Desarrollo
npm run dev

# Lint
npm run lint

# Build de producción
npm run build

# Vista previa del build
npm run preview
```

No hay suite de tests automatizados configurada. La verificación actual es:

- `npm run lint` sin errores.
- `npm run build` exitoso.
- Prueba manual de las tres homes con cada rol.
- Prueba de confirmar turno, atender turno y finalizar tratamiento, recargando para verificar la persistencia.
- Prueba del modo API con un servidor temporal o un `fetch` simulado.

---

## 16. Problemas comunes

### “Cambié `.env` y no pasa nada”

Reiniciar `npm run dev`. Vite lee las variables al arrancar.

### “Puse `VITE_API_READY=true` y todo da error”

No hay backend, la URL es incorrecta o faltan endpoints. Volver a `false` para trabajar con mocks.

### “No veo los datos nuevos de los JSON”

`localStorage` tiene datos viejos guardados. Borrar las claves `patasana_*` desde DevTools o ejecutar:

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith('patasana_'))
  .forEach((key) => localStorage.removeItem(key));
```

### “El login no funciona en modo API”

Verificar que exista `POST /auth/login`, que acepte `{ email, password }` y que devuelva un usuario con `role`. Si devuelve otro shape, ajustar `features/auth/api.js`.

### “La API está en otro puerto y `/pets` da 404”

Las rutas son relativas. Configurar un proxy en Vite o agregar `VITE_API_URL` como se explica en la sección 10.7.

### “Los enlaces del sidebar recargan la página”

Es un comportamiento previo al refactor: `NavItem` usa `<a href>`. No forma parte de este cambio. Las rutas como `/pets`, `/appointments`, etc. todavía no están implementadas.

---

## 17. Alcance actual y pendientes

Implementado:

- Mocks JSON por feature.
- `api.js` por feature con modo mock/API.
- `index.js` por feature.
- Login y rutas protegidas dentro de `features/auth`.
- Homes de cliente, veterinario y recepción consumiendo las APIs de feature.
- Variable `VITE_API_READY` y archivos de entorno.
- Persistencia mock en `localStorage`.

Pendiente / fuera de alcance:

- Backend real.
- Páginas de mascotas, turnos, tratamientos, pagos, historial y perfil.
- CRUD completo de usuarios y turnos.
- Navegación con `Link` en lugar de `<a href>`.
- Tests automatizados.
- `VITE_API_URL` o proxy para APIs en otro origen.
- Persistencia de sesión entre recargas.
