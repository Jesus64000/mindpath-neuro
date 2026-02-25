# Referencia de la API REST (Mindpath Neuro)

La API de Mindpath Neuro ha sido diseñada siguiendo los principios RESTful, usando JSON como principal formato de intercambio para el Frontend (React).

La URL base local es siempre: `http://localhost:3000/api`

---

## 1. Módulo de Autenticación (`/auth`)

### `POST /auth/register`

**Registra un nuevo usuario.**

- **Body:** `{ email, password, full_name, role }` (`role` = "patient" o "doctor")
- **Roles secundarios en registro:** (Si es "patient", se acepta `date_of_birth` y `gender`. Si es "doctor", se pide `specialty` y `license_number`).
- **Responde:** `201 Created` - Devuelve el `token` JWT y los datos públicos del usuario.

### `POST /auth/login`

**Inicia sesión en la plataforma.**

- **Body:** `{ email, password }`
- **Responde:** `200 OK` - Devuelve el `token` persistente.

---

## 2. Módulo de Reserva (`/bookings`)

### `GET /bookings/availability`

**Calcula la agenda precisa del doctor sin solapamientos.**

- **Query Params:** `?doctorId=N&date=YYYY-MM-DD`
- **Retorno:** Un Array de Strings con los slots de la hora disponibles (por ejemplo `["08:00", "09:30"]`). El algoritmo excluye citas de la tabla `appointments` confirmadas y calcula basándose en `doctor_schedules.slot_duration`.

### `POST /bookings`

**Crea la orden de Cita Médica.**

- **Body:** `{ doctor_id, appointment_date, start_time, type }` (`type` puede ser `virtual` o `presential`).
- **Responde:** `201 Created` - Vincula al Paciente (leído desde el `req.user.id` del Token) con el Doctor indicado.

---

## 3. Módulo de Consulta Médica (`/consultations`)

El corazón operativo del doctor para atender videollamadas.

### `POST /consultations`

**Inicia el encuentro de la sala.**

- **Body:** `{ appointment_id }`
- **Responde:** Marca el `appointments.status` como "in-progress" e inicializa el `clinical_reports` (Expediente Clínico) en blanco.

### `GET /consultations/history`

**El feed de atenciones finalizadas.**

- Retorna la lista de expedientes compartidos. Pacientes y Doctores pueden leerla (cada rol solo ve sus expedientes si la consulta fue marcada `completed`).

### `POST /consultations/:id/finalize`

**Da de alta médica el reporte del día.**

- Finaliza la teleconsulta y guarda el PDF del informe con los datos subjetivos y objetivos médicos.

---

## 4. Respuestas Estandarizadas de Error

En caso de un error general, el backend devuelve el siguiente formato (HTTP 400 o 500):

```json
{
  "message": "Mensaje legible para el usuario / toast notification"
}
```

En caso de tokens JWT fallidos, expirados, o falta de permisos para la ruta (como acceder al `/api/admin` siendo Paciente), el backend corta la conexión prematuramente y envía `HTTP 403 Forbidden` (`Acceso denegado`).
