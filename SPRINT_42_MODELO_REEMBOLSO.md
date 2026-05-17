# Sprint 42: Modelo de Reembolso, Tarifas Dinámicas y Pago Presencial

Este documento explica cómo funciona la implementación del Sprint 42 en MindPath Neuro, qué problema resuelve, cómo fluye la información entre frontend, backend y base de datos, y qué partes son técnicas vs. qué partes requieren validación legal externa.

## 1. Objetivo del Sprint

El objetivo del Sprint 42 es soportar un modelo de reembolso en el que:

- El paciente puede reservar una consulta y luego pedir reembolso a su seguro.
- El precio de la cita no es fijo: puede variar por doctor, modalidad, día de semana y franja horaria.
- En consultas presenciales, el paciente puede pagar en consultorio y no necesariamente por la plataforma.
- El sistema deja evidencia técnica de la consulta, del pago y de la trazabilidad documental para que el expediente sea coherente y auditable.

Este sprint no sustituye revisión legal. La plataforma prepara la evidencia y el control operativo, pero el formato final de factura, recibo e informe debe ser validado por asesoría legal y fiscal local.

## 2. Qué Cambió a Nivel General

Antes de este sprint, el sistema ya sabía:

- Agendar citas.
- Calcular disponibilidad.
- Gestionar horarios y excepciones.
- Cerrar consultas con un informe clínico.
- Generar un PDF del informe.

Con el Sprint 42 se añadió:

- Cotización previa al agendar.
- Tarifario dinámico por doctor.
- Snapshot del precio al momento de reservar.
- Método de pago para citas presenciales.
- Estado de pago separado del estado clínico.
- Validación obligatoria del pago antes de cerrar consultas presenciales con pago en consultorio.
- Código y hash de verificación para trazabilidad legal.
- PDF con evidencia de reembolso.

## 3. Flujo Completo del Sistema

### 3.1 Selección de cita por el paciente

El paciente entra al perfil del doctor y elige:

- Fecha.
- Hora.
- Modalidad: virtual o presencial.
- Si es presencial, el tipo de pago: plataforma o consultorio.

El frontend usa la disponibilidad real del doctor y consulta una cotización antes de confirmar.

### 3.2 Cálculo de tarifa

Cuando el paciente elige una hora, el frontend llama al endpoint de quote. El backend calcula el precio con esta prioridad:

1. Regla específica del doctor para esa modalidad, día y hora.
2. Regla general del doctor para esa modalidad.
3. Tarifa base del doctor.

Eso permite manejar casos como:

- Lunes presencial: 40 USD.
- Online por la noche: 30 USD.
- Fin de semana: 50 USD.

### 3.3 Reserva de cita

Al reservar, el sistema guarda:

- Doctor.
- Paciente.
- Fecha y hora.
- Tipo de cita.
- Tarifa congelada.
- Método de pago.
- Estado de pago inicial.

La tarifa queda congelada en la cita, para que luego no cambie aunque el doctor altere sus precios futuros.

### 3.4 Dónde se configuran los métodos de pago

Hoy hay dos niveles distintos:

- Método de pago de la cita: se elige al reservar, y el sistema ya lo guarda como `platform` o `in_person`.
- Catálogo de métodos de pago del doctor: sirve para mostrar o registrar formas concretas como transferencia, efectivo, Zelle o Binance.

En la implementación actual, el catálogo de métodos de pago del doctor no tiene pantalla propia todavía. Para pruebas se configura directamente en base de datos con la tabla `doctor_payment_methods` que quedó en `docs/pendiente.sql`.

Ejemplo de datos de prueba:

```sql
INSERT INTO doctor_payment_methods (doctor_id, method_name, account_details, is_active, sort_order)
VALUES
(1, 'Efectivo en consultorio', 'Pago directo al terminar la consulta', 1, 1),
(1, 'Transferencia', 'Banco X - Cuenta 12345678 - RIF J-12345678-9', 1, 2),
(1, 'Zelle', 'doctor@correo.com', 1, 3);
```

Si quieres que esto aparezca en una pantalla, el siguiente paso sería agregar un bloque en `DoctorProfileSettings` o un módulo propio del doctor para administrar estos registros.

### 3.4 Consulta y cierre clínico

Durante la consulta, el doctor completa el informe clínico como antes.

Si la cita es presencial y fue marcada como pago en consultorio, el sistema obliga a que el doctor confirme el pago antes de poder cerrar la consulta.

Solo cuando eso ocurre el sistema marca la cita como completada y registra la evidencia legal.

### 3.5 Kit de reembolso

Al cerrar la consulta, el sistema ya tiene:

- Monto.
- Modalidad.
- Estado de pago.
- Referencia de pago.
- Código legal de verificación.
- Hash de integridad.
- Informe clínico.
- RIF del doctor.

Con eso se genera un PDF con la evidencia clínica y financiera para soporte de reembolso.

## 4. Modelo de Datos

### 4.1 Tabla de reglas de precio

Se añadió la tabla `doctor_rate_rules` en la migración pendiente.

Su propósito es permitir precios dinámicos por:

- Doctor.
- Modalidad.
- Día de la semana.
- Franja horaria.
- Prioridad de la regla.

La idea es que el sistema pueda encontrar la regla más específica sin necesidad de duplicar lógica en frontend.

### 4.2 Nuevos campos en appointments

La cita ahora guarda:

- `consultation_fee_snapshot`: precio final al momento de reservar.
- `payment_method`: `platform` o `in_person`.
- `payment_status`: `pending`, `paid`, `verified`, `rejected`.
- `payment_reference`: texto libre o comprobante.
- `payment_collected_at`: fecha y hora del cobro.
- `legal_verification_code`: código visible para trazabilidad.
- `legal_verification_hash`: hash de integridad.

Estos campos permiten que la cita conserve su contexto financiero, incluso si después cambian las tarifas del doctor.

## 5. Backend: Cómo Funciona

### 5.1 Cotización

Se agregó el endpoint `GET /bookings/quote`.

Ese endpoint recibe:

- doctorId.
- date.
- type.
- start_time.

Devuelve:

- price.
- currency.
- source.
- ruleId.
- dayOfWeek.

La lógica está en `backend/controllers/bookingController.js`.

### 5.2 Reserva

Cuando se confirma una cita, el backend ahora:

- Calcula la tarifa.
- Guarda el snapshot del precio.
- Guarda el método de pago.
- Inicializa el estado de pago en pending.

Esto evita que la factura futura dependa de una tarifa modificada más adelante.

### 5.3 Cierre de consulta

En `backend/controllers/reportController.js`, el cierre clínico ahora valida:

- Si la consulta es presencial.
- Si el método de pago fue pago en consultorio.
- Si el pago no fue confirmado, no deja cerrar.

Si sí se confirmó, el sistema:

- Genera un código legal de verificación.
- Genera un hash SHA-256 de integridad.
- Marca la cita como completed.
- Actualiza el estado de pago.
- Guarda la referencia del pago.

### 5.4 Detalle de cita

El detalle de cita del doctor y los listados ahora exponen campos de pago y precio para que el equipo pueda auditar el caso.

## 6. Frontend: Cómo Lo Ve el Usuario

### 6.1 Reserva del paciente

En `frontend/src/pages/patient/DoctorBooking.jsx`:

- El paciente selecciona modalidad.
- Si elige presencial, puede elegir pago en consultorio o por plataforma.
- Al seleccionar hora, el sistema muestra la tarifa cotizada.
- Al confirmar, la reserva envía el método de pago al backend.

Esto da transparencia antes de agendar.

### 6.2 Cierre del doctor

En `frontend/src/pages/doctor/WrapUp.jsx`:

- El doctor sigue generando el informe clínico.
- Aparece una sección de pago y reembolso.
- El doctor debe marcar si recibió el pago.
- Puede dejar una referencia de pago.
- Si la cita es presencial con pago en consultorio y no se marca el pago, no se puede finalizar.

### 6.3 PDF exportable

En `frontend/src/components/ReportPDF.jsx`:

- Se muestra el RIF del doctor.
- Se muestra el monto registrado.
- Se muestra el método de pago.
- Se muestra el estado de pago.
- Se muestra la referencia.
- Se muestra el código legal.

El PDF ya no es solo clínico: también sirve como pieza de soporte para reembolso.

## 7. Estados Importantes

### 7.1 Estados de cita

El sprint no cambió el modelo base de status clínico, pero ahora esos estados conviven con el estado financiero.

Estados clínicos típicos:

- pending.
- confirmed.
- completed.
- cancelled.

### 7.2 Estados de pago

Estados de pago típicos:

- pending: todavía no se confirmó el cobro.
- paid: el dinero fue recibido.
- verified: el pago fue validado manualmente.
- rejected: el pago fue rechazado o requiere revisión.

## 8. Casos de Uso Reales

### 8.1 Consulta virtual pagada por plataforma

1. El paciente selecciona virtual.
2. El frontend cotiza el precio.
3. El paciente reserva.
4. El pago queda asociado como pago por plataforma.
5. El doctor realiza la consulta.
6. El doctor firma el informe.
7. El sistema emite el PDF con trazabilidad.

### 8.2 Consulta presencial con pago en consultorio

1. El paciente selecciona presencial.
2. Elige pago en consultorio.
3. El sistema guarda la reserva con estado de pago pendiente.
4. El paciente asiste y paga en sitio.
5. El doctor marca pago recibido.
6. El doctor cierra la consulta.
7. Se genera el PDF con evidencia completa.

### 8.3 Cambio de tarifa futuro

Si el doctor cambia sus tarifas mañana, las citas ya reservadas siguen usando el snapshot guardado al momento de la reserva. Eso evita conflictos con reembolsos ya en curso.

## 9. Qué Parte Es Técnica Y Qué Parte Es Legal

### 9.1 Lo que sí hace el sistema

- Guarda trazabilidad.
- Bloquea cierres inconsistentes.
- Registra datos de pago.
- Genera hashes y códigos de verificación.
- Produce documentos consistentes.
- Mantiene snapshot del precio.

### 9.2 Lo que no reemplaza

El sistema no reemplaza:

- Un abogado.
- Un contador o fiscalista.
- La validación de facturación local.
- La normativa sanitaria del país.

## 10. Riesgos y Recomendaciones

- No usar el PDF como “factura fiscal” si no ha sido revisado por el área legal.
- No prometer validez regulatoria total sin revisión de normativa local.
- Mantener el hash y el código legal como mecanismo interno de integridad, no como sustituto de firma electrónica certificada si la ley la exige.
- Si se desea facturación formal, separar el módulo fiscal del módulo clínico.

## 11. Archivos Clave

- Backend de cotización y reserva: `backend/controllers/bookingController.js`
- Validación de pago y cierre: `backend/controllers/reportController.js`
- Detalle de citas y estados: `backend/controllers/appointmentController.js`
- UI de reserva: `frontend/src/pages/patient/DoctorBooking.jsx`
- UI de cierre clínico: `frontend/src/pages/doctor/WrapUp.jsx`
- PDF de reembolso: `frontend/src/components/ReportPDF.jsx`
- Migración pendiente: `docs/pendiente.sql`
- Documentación API: `docs/technical/API_REFERENCE.md`

## 12. Resumen Ejecutivo

En una frase: el Sprint 42 convierte la cita en una entidad con precio, pago, evidencia y trazabilidad, para que el sistema soporte reembolso de forma consistente sin mezclar la lógica médica con una integración financiera rígida.

Si más adelante se quiere endurecer aún más el flujo, el siguiente paso natural sería separar un módulo fiscal formal con generación de recibos/facturas independientes y estados de validación por admin.