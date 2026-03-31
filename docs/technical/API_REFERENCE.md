# Referencia de la API REST — MindPath Neuro

La API de Mindpath Neuro sigue los principios RESTful usando JSON como formato de intercambio. Toda ruta protegida requiere el header `Authorization: Bearer <token>`.

**URL Base local:** `http://localhost:3000/api`

---

## 🔐 Autenticación (`/auth`)

### `POST /auth/register`
Registra un nuevo usuario.
- **Body:** `{ email, password, full_name, role }` + campos de rol (paciente: `date_of_birth`, `gender`; doctor: `specialty`, `license_number`)
- **Responde:** `201` con `{ token, user }`

### `POST /auth/login`
Inicia sesión.
- **Body:** `{ email, password }`
- **Responde:** `200` con `{ token, user }`

---

## 📅 Reservas / Booking (`/bookings`)

### `GET /bookings/availability`
Calcula los slots libres del doctor para una fecha, excluyendo citas confirmadas y excepciones.
- **Query:** `?doctorId=N&date=YYYY-MM-DD`
- **Responde:** `["08:00", "09:30", ...]`

### `POST /bookings`
Crea una cita. El paciente se lee del JWT.
- **Body:** `{ doctor_id, appointment_date, start_time, type }` (`type`: `virtual` | `presential`)
- **Responde:** `201` con la cita creada

---

## 🩺 Doctor — Disponibilidad (`/doctors`)

### `GET /doctors/schedule`
Obtiene los bloques de horario regular del doctor autenticado.

### `POST /doctors/schedule`
Crea un bloque de horario regular.
- **Body:** `{ day_of_week, start_time, end_time, slot_duration }`

### `DELETE /doctors/schedule/:id`
Elimina un bloque de horario.

### `GET /doctors/exceptions`
Lista las excepciones futuras del doctor autenticado.

### `POST /doctors/exceptions` *(Sprint 33/35)*
Crea excepciones para un **rango de fechas** completo.
- **Body:** `{ startDate, endDate, isDayOff, startTime?, endTime? }`
- El backend itera día a día entre `startDate` y `endDate` e inserta con `ON DUPLICATE KEY UPDATE`.

### `DELETE /doctors/exceptions/:id`
Elimina una excepción individual.

---

## 🚨 Bloqueo de Emergencia (`/doctors`)

### `POST /doctors/emergency-block`
Bloquea la agenda del doctor (cancela todas las citas futuras como `emergency_reschedule`).
- **Body:** `{ duration }` (`2_days`, `1_week`, `2_weeks`, `1_month`, `3_months`, `indefinite`)

### `PUT /doctors/emergency-block/extend`
Extiende la duración del bloqueo activo.
- **Body:** `{ duration }`

### `DELETE /doctors/emergency-block`
Reactiva la agenda del doctor.

---

## 📋 Citas del Doctor (`/appointments/doctor`)

### `GET /appointments/doctor/summary`
Devuelve el calendario con conteo de citas por fecha y el listado de citas de un día.
- **Query:** `?date=YYYY-MM-DD`

### `PUT /appointments/:id/confirm`
Confirma una cita pendiente.

### `PUT /appointments/:id/cancel`
Cancela una cita establecida.

---

## 👤 Citas del Paciente (`/appointments/patient` / `/patients`)

### `GET /patients/appointments`
Lista paginada de todas las citas del paciente autenticado.
- **Query:** `?page=1&status=confirmed`

### `PUT /appointments/:id/cancel`
El paciente cancela su propia cita.

### `GET /patients/dashboard`
Resumen del dashboard del paciente (próxima cita, doctor favorito, stats).

---

## 🎥 Consultas (`/consultations`)

### `POST /consultations`
Inicia la sala de videoconsulta.
- **Body:** `{ appointment_id }`
- Marca el estado como `in-progress` e inicializa el `clinical_report`.

### `GET /consultations/history`
Historial de consultas completadas del usuario autenticado.

### `POST /consultations/:id/finalize`
Finaliza la consulta y guarda el informe SOAP.
- **Body:** `{ antecedentes, hallazgos, diagnostico, tratamiento, private_notes, is_shared }`

---

## 📊 Estadísticas del Doctor (`/doctors/stats`)

### `GET /doctors/stats`
Devuelve KPIs del doctor: total citas, tasa de completitud, distribución por tipo, citas por mes.
- Usado por `DoctorStats.jsx` para renderizar las barras verticales proporcionales.

---

## 🛡️ Administración (`/admin`) — Solo `admin` / `supervisor`

### `GET /admin/stats`
KPIs globales de la plataforma.

### `GET /admin/doctors/pending`
Lista de doctores pendientes de verificación.

### `PUT /admin/doctors/:id/verify`
Aprueba un doctor.

### `PUT /admin/doctors/:id/reject`
Rechaza un doctor.
- **Body:** `{ notes }` (motivo)

### `GET /admin/specialties`
Lista de especialidades.

### `POST /admin/specialties`
Crea una especialidad.

### `PUT /admin/specialties/:id`
Edita una especialidad.

### `DELETE /admin/specialties/:id`
Elimina una especialidad (falla si tiene doctores asociados).

### `GET /admin/users`
Lista paginada/filtrada de usuarios.
- **Query:** `?search=&role=`

### `PUT /admin/users/:id/toggle`
Suspende o reactiva una cuenta.

### `PUT /admin/users/:id/role`
Cambia el rol de un usuario (solo admin).

### `GET /admin/settings`
Obtiene la configuración estética guardada.

### `PUT /admin/settings`
Guarda la configuración de personalización.
- **Body:** `{ clinic_name, logo_url, primary_color, primary_hover, font_family }`

### `POST /admin/upload/logo`
Sube el logo de la clínica.
- **Content-Type:** `multipart/form-data` con campo `logo`

---

## ⚠️ Respuestas de Error Estandarizadas

```json
{ "message": "Descripción del error legible para el usuario" }
```

| Código | Significado |
|---|---|
| `400` | Datos inválidos o faltantes |
| `401` | Token ausente o expirado |
| `403` | Sin permisos para esta ruta |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej. email duplicado) |
| `500` | Error interno del servidor |
