# Manual de Usuario: Médicos Especialistas

Bienvenido a **Mindpath Neuro**. Esta guía está diseñada para los profesionales clínicos. Aquí aprenderás a administrar tus horarios, pacientes, agenda y expedientes electrónicos.

---

## 1. Perfil Público y Verificación

Al registrarte como doctor deberás adjuntar tu `Número de Cédula o Colegiado Médico` y `Especialidad`.

- **Importante:** Tu perfil permanecerá oculto del directorio público hasta que el personal de la clínica verifique tu identidad y cambie tu estado a **"Verificado"**.
- Rellena tu perfil profesional en **Configuración de Perfil** en la barra lateral: biografía, años de experiencia, idiomas, educación y honorarios de consulta.

---

## 2. Mi Agenda Médica — Las Dos Pestañas

La vista **Agenda** en el menú lateral tiene dos secciones principales:

### 📅 Mis Citas

Aquí ves el calendario mensual con la cantidad de citas por día, y al seleccionar un día el panel derecho lista las citas con los datos del paciente y su estado.

**Acciones disponibles:**
- ✅ **Confirmar** — Cambia la cita de `pendiente` a `confirmada`.
- ❌ **Cancelar** — Cancela la cita con registro de motivo.
- 🎥 **Iniciar Sala** — Para citas virtuales confirmadas, abre la videoconsulta.

### ⚙️ Mi Disponibilidad

Esta sección está dividida en dos **sub-pestañas**:

#### 🕒 Horario Regular

Define tu rutina semanal fija:
1. Selecciona el **Día de la semana** (Lunes a Domingo).
2. Configura la **Hora de inicio** y **Hora de fin** del turno.
3. Elige la **Duración de la cita** (30, 45 o 60 minutos).
4. Haz clic en **Agregar Franja**.
5. Puedes agregar **múltiples franjas** al mismo día (ej. Mañana y Tarde) y eliminarlas con el ícono de papelera.

#### 🌴 Vacaciones y Días Libres

Para marcar días donde **no atenderás** (o atenderás en horario especial):

1. Selecciona el **rango de fechas** en el calendario interactivo (arrastra desde el primer día hasta el último).
2. Si marcas **"¿Serán días libres completos?"** → los pacientes no podrán agendar en esas fechas.
3. Si desmarcas → puedes definir un horario especial diferente al habitual.
4. Haz clic en **Guardar Excepción**.
5. El sistema insertará automáticamente un registro por cada día del rango.

> **Ejemplo:** Si seleccionas del 14 al 20 de abril como vacaciones, el sistema creará 7 excepciones de forma automática.

---

## 3. Bloqueo de Emergencia Médica

Si tienes una emergencia personal y necesitas cerrar tu agenda de inmediato:

1. En la pestaña **Mis Citas**, usa el botón rojo **Bloqueo de Emergencia**.
2. El sistema cancela automáticamente todas tus citas futuras confirmadas y marca las pendientes como `emergency_reschedule`.
3. Al presionar el banner naranja de alerta (cuando ya tienes un bloqueo activo), puedes:
   - **Extender el bloqueo** (2 días, 1 semana, 1 mes, hasta nuevo aviso).
   - **Reactivar tu Agenda** inmediatamente.

---

## 4. La Videoconsulta e "IA Doctor"

Al momento de la teleconsulta virtual:

1. Haz clic en **Iniciar Sala** en la cita correspondiente.
2. Entrarás al panel `ConsultationRoom`. A la izquierda: video del paciente. A la derecha: **Tu Pizarra Médica Privada**.
3. Anota _Notas Privadas_ mientras consultas (no visibles por el paciente en tiempo real).
4. **Resumen Inteligente IA:** Haz clic en el botón de IA (Gemini) para que el sistema procese tus notas rápidas y redacte los campos SOAP (Antecedentes, Hallazgos, Diagnóstico, Tratamiento) de forma estandarizada.

---

## 5. Cierre Clínico y PDF

Al culminar la atención médica:

1. Completa el formulario de cierre (Diagnóstico, Tratamiento recomendado).
2. Haz clic en **Finalizar Consulta**.
3. El informe SOAP queda **compartido** con el paciente para descarga en PDF.

---

## 6. Panel de Estadísticas

En la sección **Estadísticas** de tu sidebar:

- **Gráfica de Citas por Mes** — Barras verticales con altura proporcional. El mes con más citas ocupa el 100% de altura; el resto escala proporcionalmente. Pasa el cursor sobre cada barra para ver el número exacto.
- **Tasa de Confirmación** — Porcentaje de citas que llegan a completarse.
- **Distribución por Tipo** — Virtual vs. Presencial.
