# Manual de Administración: Panel de Control — MindPath Neuro

Este manual está dirigido a usuarios con rol `admin` y `supervisor`. Describe todas las herramientas del **Panel de Administración** para gestionar la clínica digitalmente.

---

## 1. Acceso al Panel

Inicia sesión con una cuenta de rol `admin` o `supervisor`. En el sidebar verás el ítem **Panel**. Al hacer clic accedes al centro de control con las siguientes pestañas:

| Pestaña | Disponible para |
|---|---|
| 📊 Métricas | Solo Admin |
| 🩺 Verificación | Admin y Supervisor |
| 🗂️ Catálogos | Admin y Supervisor |
| 🛡️ Equipo | Solo Admin |
| 👥 Usuarios | Admin y Supervisor |
| 🎨 Personalización | Solo Admin |

---

## 2. 📊 Métricas del Sistema

Vista ejecutiva con los KPIs de la clínica en tiempo real:

- **Usuarios Totales** — Total de cuentas registradas.
- **Doctores Verificados** — Cuántos están públicamente activos.
- **Pendientes de Verificar** — Doctores esperando aprobación.
- **Citas Completadas, Activas, Canceladas** — Panel de actividad.
- **Tasa de Confirmación** — Eficiencia del flujo de citas.
- **Gráfica Citas por Mes** — Barras interactivas de los últimos 12 meses.
- **Distribución por Especialidad** — Pie chart de demanda.
- **Top 5 Doctores** — Ranking por volumen de citas completadas.

---

## 3. 🩺 Verificación de Doctores

Cuando un médico se registra, su perfil entra en modo **pendiente** y no aparece en el directorio público. Desde esta pestaña:

1. Se lista cada doctor pendiente con: nombre, especialidad, clínica, número de licencia y email.
2. Haz clic en **✅ Aprobar** para verificarlo (aparece inmediatamente en el directorio).
3. Haz clic en **❌ Rechazar** → se abre un modal para ingresar el motivo del rechazo (queda registrado en el expediente del doctor).

---

## 4. 🗂️ Catálogos — Gestión de Especialidades

Crea, edita y elimina las especialidades disponibles en la plataforma:

- **Agregar:** Escribe el nombre en el campo y presiona Enter o el botón **Agregar**.
- **Editar:** Icono de lápiz → edita en línea → **Guardar**.
- **Eliminar:** Icono de papelera. ⚠️ No se pueden eliminar especialidades que tengan doctores asociados.

---

## 5. 🛡️ Gestión del Equipo

Lista del equipo interno (admins y supervisores). Desde aquí puedes:

- Ver todos los miembros del equipo con su rol y estado.
- Cambiar el rol de un miembro mediante el desplegable **Rol**.
- Suspender / Reactivar cuentas con el toggle verde/rojo.

---

## 6. 👥 Gestión de Usuarios

Directorio completo de todos los usuarios registrados en la plataforma:

- **Búsqueda** por nombre o email.
- **Filtro por Rol** (Admin, Supervisor, Doctor, Paciente).
- **Cambio de Rol** — Dropdown en línea por usuario.
- **Suspender/Reactivar** — Toggle instantáneo sin borrar datos.

> ⚠️ No puedes modificar tu propia cuenta desde esta lista (protección anti-lockout).

---

## 7. 🎨 Motor de Personalización

Personaliza la identidad visual de la clínica. Los cambios se aplican en tiempo real en todo el sistema para todos los usuarios.

### Campos disponibles:

| Campo | Descripción |
|---|---|
| Nombre de la Clínica | Aparece en el sidebar y correos |
| Color Primario | Color de botones, links e íconos activos (selector visual) |
| Color Hover | Color al pasar el cursor sobre botones |
| Tipografía | Fuente de todo el sistema |
| Logo | Sube un archivo (PNG, JPG, SVG, WEBP) o pega una URL |

### Inyección Dinámica de Google Fonts *(Sprint 37)*

En el selector de **Tipografía**:
- Elige entre 10 fuentes predefinidas (Inter, Poppins, Roboto, etc.).
- O selecciona **✨ Google Font personalizada...** para escribir cualquier nombre exacto de [fonts.google.com](https://fonts.google.com).
- La **caja de vista previa** se actualiza en tiempo real mientras escribes el nombre.
- Al hacer clic en **Guardar Configuración**, la fuente se descarga del CDN de Google y se aplica globalmente en todo el DOM.

### Botón Restaurar por Defecto

Devuelve los colores a `#6D28D9` (primario) y `#5B21B6` (hover).

### Vista Previa del Sistema

Muestra una miniatura del sidebar y contenido con los colores y logo actuales antes de guardar.

---

## 8. Flujo de Guardado

Al hacer clic en **Guardar Configuración**:
1. Si se seleccionó un logo → se sube al servidor.
2. Se envía un `PUT /admin/settings` con todos los campos.
3. El frontend aplica inmediatamente los cambios vía `useSettingsStore.applySettings()`.
4. Todos los usuarios verán los cambios en su próxima carga de página (los cambios persisten en BD).
