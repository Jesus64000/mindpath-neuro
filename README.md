# Mindpath Neuro 🧠

Plataforma integral de telemedicina y gestión clínica para profesionales de la salud mental y neurología. Conecta pacientes con doctores, facilita videoconsultas en tiempo real y ofrece un sistema completo de historiales clínicos y administración hospitalaria.

## 🚀 Tecnologías Principales

**Frontend:**

- [React](https://reactjs.org/) (Vite) — SPA con enrutamiento protegido por rol
- [Tailwind CSS](https://tailwindcss.com/) — Modo Oscuro nativo, theming dinámico con variables CSS
- [Zustand](https://github.com/pmndrs/zustand) — Estado global (auth, settings, tema)
- [React Router DOM](https://reactrouter.com/) — Navegación protegida por `PrivateRoute`
- [Lucide React](https://lucide.dev/) — Iconografía ligera y consistente
- [Axios](https://axios-http.com/) — Cliente HTTP con interceptores de JWT
- [react-datepicker](https://reactdatepicker.com/) — Calendario interactivo para selección de rangos de vacaciones

**Backend:**

- [Node.js](https://nodejs.org/) con [Express.js](https://expressjs.com/)
- [MySQL2](https://www.npmjs.com/package/mysql2) — Base de Datos Relacional con Promises
- [JSON Web Tokens (JWT)](https://jwt.io/) — Autenticación stateless
- [Bcryptjs](https://www.npmjs.com/package/bcryptjs) — Cifrado de contraseñas
- [Multer](https://www.npmjs.com/package/multer) — Subida de archivos (logo, avatar)
- [ZegoCloud Server API](https://www.zegocloud.com/) — Infraestructura de videollamadas WebRTC

**Inteligencia Artificial:**

- [Google Gemini API](https://ai.google.dev/) — Resúmenes clínicos estructurados en formato SOAP a partir de notas del doctor.

---

## 💻 Requisitos Previos

1. **Node.js**: Versión `v18.x`, `v20.x` o `v22.x`
2. **NPM**: Incluido con Node.js
3. **Servidor MySQL**: XAMPP, WAMP o MySQL nativo (puerto por defecto `3306`)

---

## 🛠️ Instalación Rápida (Nuevo — Automatizada)

### 1. Clonar el Repositorio

```bash
# git clone <url-del-repo>
cd mindpath-neuro
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crea el archivo `backend/.env` con tus credenciales:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mindpath_db
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=tu_api_key_de_gemini
VIDEO_APP_ID=tu_app_id_de_zegocloud
VIDEO_SERVER_SECRET=tu_secreto_de_zegocloud
```

### 3. Instalar la Base de Datos Automáticamente

```bash
node setupDB.js
```

> Este script crea la base de datos `mindpath_db` automáticamente si no existe, lee el archivo `docs/db_mindpath.sql` y construye todas las tablas, columnas, índices y datos iniciales en un solo comando.
> 
> **Usuario inicial:** `admin@admin.com` / `admin123`

### 4. Arrancar el Backend

```bash
npm run dev
```

### 5. Configurar el Frontend

```bash
cd ../frontend
npm install
```

Crea `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_ZEGO_APP_ID=tu_app_id_numerico
VITE_ZEGO_SERVER_SECRET=tu_server_secret
```

```bash
npm run dev
```

El frontend arranca en `http://localhost:5173`.

---

## 📚 Documentación

| Categoría | Archivo |
|---|---|
| ⚙️ Arquitectura | [ARCHITECTURE.md](docs/technical/ARCHITECTURE.md) |
| 🗄️ Modelo de BD | [DATABASE_SCHEMA.md](docs/technical/DATABASE_SCHEMA.md) |
| 🔌 API REST | [API_REFERENCE.md](docs/technical/API_REFERENCE.md) |
| 🔒 Seguridad | [SECURITY_CONFIG.md](docs/technical/SECURITY_CONFIG.md) |
| 👤 Manual Paciente | [USER_MANUAL_PATIENT.md](docs/manuals/USER_MANUAL_PATIENT.md) |
| 🩺 Manual Doctor | [USER_MANUAL_DOCTOR.md](docs/manuals/USER_MANUAL_DOCTOR.md) |
| 🛡️ Manual Admin | [ADMIN_MANUAL.md](docs/manuals/ADMIN_MANUAL.md) |
| 🚀 Despliegue | [DEPLOYMENT.md](docs/ops/DEPLOYMENT.md) |
| 🔧 Instalación | [manual_instalacion.md](docs/manual_instalacion.md) |

---

> **Diseñado con pasión para mejorar el acceso a los servicios de salud mental a través de una experiencia técnica fluida y premium.**
