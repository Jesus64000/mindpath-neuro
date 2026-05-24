# Mindpath Neuro 🧠

Plataforma integral de telemedicina y gestión clínica para profesionales de la salud mental y neurología. Conecta pacientes con doctores, facilita videoconsultas en tiempo real y ofrece un sistema completo de historiales clínicos y administración hospitalaria.

## 🚀 Tecnologías Principales

**Frontend:**

- [React 19](https://reactjs.org/) (Vite) — SPA con enrutamiento protegido por rol
- [Tailwind CSS](https://tailwindcss.com/) — Modo Oscuro nativo, theming dinámico con variables CSS
- [Zustand](https://github.com/pmndrs/zustand) — Estado global (auth, settings, tema)
- [React Router DOM](https://reactrouter.com/) — Navegación protegida por `ProtectedRoute`
- [Lucide React](https://lucide.dev/) — Iconografía ligera y consistente
- [Axios](https://axios-http.com/) — Cliente HTTP con interceptores de JWT
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — PWA instalable en móviles y escritorio
- [@react-oauth/google](https://github.com/MomenSherif/react-oauth) — Autenticación con Google OAuth 2.0
- [ZegoCloud UIKit](https://www.zegocloud.com/) — Videollamadas WebRTC

**Backend:**

- [Node.js](https://nodejs.org/) con [Express.js](https://expressjs.com/)
- [MySQL2](https://www.npmjs.com/package/mysql2) — Base de Datos Relacional con Promises
- [JSON Web Tokens (JWT)](https://jwt.io/) — Autenticación stateless (8h)
- [Bcryptjs](https://www.npmjs.com/package/bcryptjs) — Cifrado de contraseñas (10 rondas)
- [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs) — Verificación de tokens Google
- [Nodemailer](https://nodemailer.com/) — Correos de recuperación de contraseña
- [Multer](https://www.npmjs.com/package/multer) — Subida de archivos (logo, avatar)
- [Groq SDK](https://groq.com/) — Asistente de IA para resúmenes clínicos SOAP

---

## 💻 Requisitos Previos

1. **Node.js**: Versión `v18.x`, `v20.x` o `v22.x`
2. **NPM**: Incluido con Node.js
3. **Servidor MySQL**: XAMPP, WAMP o MySQL nativo (puerto por defecto `3306`)
4. **Client ID de Google**: Ver [Guía de Google Cloud](#)

---

## 🛠️ Instalación Rápida

### 1. Clonar el Repositorio

```bash
git clone <url-del-repo>
cd mindpath-neuro
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crea el archivo `backend/.env`:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mindpath_db
DB_PORT=3306
JWT_SECRET=tu_secreto_super_seguro_min_32_chars
ENCRYPTION_KEY=MindpathSecr3tK3y!2026@NeuroApp$
GROQ_API_KEY=tu_api_key_de_groq
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

### 3. Instalar la Base de Datos

```bash
node setupDB.js
```

> Crea `mindpath_db` automáticamente con todas las tablas, índices y datos iniciales.  
> **Usuario inicial:** `admin@admin.com` / `admin123`

### 4. Arrancar el Backend

```bash
npm run dev
# http://localhost:3000
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
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

```bash
npm run dev
# http://localhost:5173
```

---

## 📚 Documentación Completa

> 📖 **[Ver documentación completa →](docs/DOCUMENTACION_COMPLETA.md)**

La documentación cubre:

| Sección | Descripción |
|---------|-------------|
| 🏗️ Arquitectura | Diagrama del sistema completo |
| 🔐 Autenticación | Login local + Google OAuth (flujo en 2 pasos) |
| 📱 PWA | Cómo instalar la app en móvil |
| 👤 Roles | Paciente, Doctor, Admin, Supervisor |
| 💌 Correos | Configuración SMTP y plantillas |
| 🚀 Despliegue | VPS con Nginx + PM2, o Railway/Render/Vercel |
| ☁️ Google Cloud | Guía paso a paso para crear el Client ID |
| 🗄️ Base de Datos | Estructura de tablas y columnas clave |
| 🔒 Seguridad | Medidas implementadas y recomendaciones |

---

> **Diseñado con pasión para mejorar el acceso a los servicios de salud mental a través de una experiencia técnica fluida y premium.**
