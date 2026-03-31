# 🚀 Manual de Instalación y Despliegue: MindPath Neuro

Este manual detalla paso a paso cómo instalar, configurar y desplegar el sistema Mindpath Neuro desde cero en un entorno local o de producción.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes componentes en tu máquina:

1. **Node.js**: Versión 18.0.0 o superior (Se recomienda la versión LTS actual).
2. **NPM**: Viene incluido con Node.js (Versión 9.x o superior).
3. **XAMPP / WAMP / MySQL Server**: Para gestionar la base de datos localmente.
4. **Git**: Para clonar o manejar el proyecto.
5. **Cuentas y API Keys**:
   - Cuenta en **Google AI Studio** (Para el motor de IA con Gemini).
   - Cuenta en **ZEGOCLOUD** (Para el servicio de videollamadas).

---

## 💾 1. Configuración de la Base de Datos

> **✨ Nuevo en Sprint 37:** El sistema incluye un instalador automático (`setupDB.js`) que reemplaza la importación manual desde phpMyAdmin.

### Método A — Automatizado (Recomendado)

1. Asegúrate de que MySQL esté corriendo (XAMPP encendido).
2. Configura tu archivo `backend/.env` con las credenciales correctas (ver sección 2.2).
3. Desde la carpeta `backend/`, ejecuta:

```bash
node setupDB.js
```

El script:
- Crea la base de datos `mindpath_db` si no existe.
- Lee el archivo `docs/db_mindpath.sql` (el esquema maestro).
- **Crea un usuario administrador por defecto:** `admin@admin.com` / `admin123`.
- Construye todas las tablas, columnas, índices y datos de catálogo en un solo paso.
- Muestra mensajes de progreso y cierra la conexión limpiamente.

Si ves `🎉 ¡ÉXITO! La Base de Datos está lista para producción.` → todo está correcto.

### Método B — Manual (phpMyAdmin)

1. Abre **phpMyAdmin** → `http://localhost/phpmyadmin`.
2. Crea una base de datos llamada `mindpath_db` con cotejamiento `utf8mb4_unicode_ci`.
3. Selecciona `mindpath_db` → pestaña **Importar**.
4. Selecciona el archivo `docs/db_mindpath.sql` → clic en **Importar**.

---

## ⚙️ 2. Configuración del Servidor Backend

### 2.1. Instalación de dependencias

```bash
cd backend
npm install
```

### 2.2. Variables de Entorno (.env)

Dentro de la carpeta `backend/`, crea (o edita) el archivo `.env`:

```env
# ── Servidor ──
PORT=3000

# ── Base de Datos (MySQL) ──
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mindpath_db

# ── Seguridad (JWT) ──
JWT_SECRET=escribe_aqui_un_codigo_secreto_largo_y_dificil_de_adivinar_123!@#
JWT_EXPIRES_IN=7d

# ── Inteligencia Artificial ──
GEMINI_API_KEY=tu_api_key_de_google_gemini_aqui

# ── ZegoCloud (opciones de servidor para tokens de videollamada) ──
VIDEO_APP_ID=tu_app_id_numerico
VIDEO_SERVER_SECRET=tu_server_secret
```

> **¿Cómo obtener la API Key de Gemini?**
> 1. Ve a [aistudio.google.com](https://aistudio.google.com/)
> 2. Haz clic en **Get API Key** → **Create API Key**.
> 3. Copia la clave generada y pégala en `GEMINI_API_KEY`.

### 2.3. Ejecutar el Servidor

```bash
npm run dev
```

Deberías ver: `✅ Base de Datos conectada exitosamente a: mindpath_db` y `Servidor corriendo en el puerto 3000`.

---

## 🎨 3. Configuración del Frontend

### 3.1. Instalación de dependencias

```bash
cd frontend
npm install
```

Las dependencias instaladas incluyen:
- `react-datepicker` — Calendario interactivo para selección de rangos (vacaciones del doctor).
- `zustand` — Estado global de sesión y theming.
- `lucide-react` — Iconografía.

### 3.2. Variables de Entorno (.env)

Dentro de la carpeta `frontend/`, crea el archivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api

# ── ZegoCloud (Videollamadas) ──
VITE_ZEGO_APP_ID=tu_app_id_numerico_aqui
VITE_ZEGO_SERVER_SECRET=tu_server_secret_alfanumerico_aqui
```

> **¿Cómo obtener credenciales de ZEGOCLOUD?**
> 1. Ve a [console.zegocloud.com](https://console.zegocloud.com/).
> 2. Crea un proyecto de tipo **Video / Voice Call**.
> 3. Copia tu `AppID` (número) → `VITE_ZEGO_APP_ID`.
> 4. Copia tu `ServerSecret` → `VITE_ZEGO_SERVER_SECRET`.

### 3.3. Ejecutar la Web

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/`.

---

## 👑 4. Creación del Primer Usuario Administrador

Con la base de datos recién instalada, crea el primer admin por cualquiera de estos métodos:

### Opción A — API REST (Postman / Thunder Client)

Haz una petición **POST** a `http://localhost:3000/api/auth/register`:

```json
{
  "full_name": "Administrador MindPath",
  "email": "admin@mindpath.com",
  "password": "PasswordSegura123!",
  "role": "admin"
}
```

### Opción B — phpMyAdmin

1. Regístrate como paciente desde la web.
2. En phpMyAdmin → tabla `users` → edita tu registro → cambia `role` de `patient` a `admin`.

---

## 🎨 5. Personalización del Sistema (Panel Admin)

Una vez logueado como administrador, ve a **Panel → 🎨 Personalización**:

- **Nombre de la clínica** — Se refleja en el sidebar y correos.
- **Colores del sistema** — Color primario y hover con preview en tiempo real.
- **Tipografía** — Elige entre 10 fuentes predefinidas de Google Fonts **o escribe cualquier nombre de Google Fonts** (ej. `Playfair Display`, `Space Mono`) para preview y aplicación instantánea en todo el sistema.
- **Logo** — Sube desde disco o pega una URL externa.

---

## 🚀 6. Empaquetado para Producción

```bash
cd frontend
npm run build
```

Esto genera la carpeta `dist/` (HTML + CSS + JS optimizados) lista para alojar en cualquier servidor estático (Netlify, Vercel, Hostinger, etc.).

---

_Fin del Manual de Instalación de MindPath Neuro — Sprint 37._
