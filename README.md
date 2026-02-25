# Mindpath Neuro 🧠

Plataforma integral de telemedicina y gestión clínica para profesionales de la salud mental y neurología. Conecta pacientes con doctores, facilita videoconsultas en tiempo real y ofrece un sistema completo de historiales clínicos y administración hospitalaria.

## 🚀 Tecnologías Principales

**Frontend:**

- [React](https://reactjs.org/) (Vite)
- [Tailwind CSS](https://tailwindcss.com/) (Estilos, Modo Oscuro nativo)
- [Zustand](https://github.com/pmndrs/zustand) (Manejo de estados globales rápidos)
- [React Router DOM](https://reactrouter.com/) (Navegación protegida)
- [Lucide React](https://lucide.dev/) (Iconografía ligera)
- [Axios](https://axios-http.com/) (Cliente HTTP)

**Backend:**

- [Node.js](https://nodejs.org/) con [Express.js](https://expressjs.com/)
- [MySQL2](https://www.npmjs.com/package/mysql2) (Base de Datos Relacional, consultas con Promesas)
- [JSON Web Tokens (JWT)](https://jwt.io/) (Autenticación y Seguridad)
- [Bcryptjs](https://www.npmjs.com/package/bcryptjs) (Cifrado de Contraseñas)
- [Multer](https://www.npmjs.com/package/multer) (Subida y Manejo de Archivos/Avatar)
- [ZegoCloud Server API](https://www.zegocloud.com/) (Infraestructura de Videollamadas)

**Inteligencia Artificial (Asistencia Clínica):**

- [Google Gemini API](https://ai.google.dev/) (Generador de resúmenes estructurados en formatos SOAP a partir del texto del doctor).

---

## 💻 Requisitos Previos

Antes de instalar este proyecto en tu entorno local, asegúrate de tener:

1. **Node.js**: Versión `v18.x`, `v20.x` o `v22.x`.
2. **NPM**: Viene incluido con Node.js.
3. **Servidor MySQL**: Puedes usar XAMPP, WAMP o un servicio nativo de MySQL (puerto por defecto `3306`).

---

## 🛠️ Guía de Instalación y Ejecución Local

Sigue estos pasos para arrancar el entorno de desarrollo:

### 1. Clonar el Repositorio

Abre tu terminal y clona la carpeta (o descomprime el archivo `.zip` si no usas Git).
\`\`\`bash

# git clone <url-del-repo>

cd mindpath-neuro
\`\`\`

### 2. Configurar el Backend

1. Abre una terminal dentro de la carpeta `backend/`.
2. Instala las dependencias de Node:
   \`\`\`bash
   npm install
   \`\`\`
3. Configura la base de datos:
   - Importa o ejecuta todos los scripts SQL disponibles en la carpeta `docs/` en orden.
   - Estos scripts crearán la base de datos `mindpath_db` (o la que hayas definido) y las tablas base.
4. Variables de Entorno (`.env`):
   Crea un archivo `.env` en `backend/` e incluye como mínimo:
   \`\`\`env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=123
   DB_NAME=mindpath_db
   JWT_SECRET=tu_secreto_super_seguro
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=tu_api_key_de_gemini
   VIDEO_APP_ID=tu_app_id_de_zegocloud
   VIDEO_SERVER_SECRET=tu_secreto_de_zegocloud
   \`\`\`
5. Arrancar Servidor de Desarrollo Backend:
   \`\`\`bash
   npm run dev
   \`\`\`
   _(El servidor arrancará típicamente en `http://localhost:3000`)_

### 3. Configurar el Frontend

1. En una **nueva ventana/pestaña** de la terminal, ve a la carpeta `frontend/`.
2. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`
3. Variables de Entorno (`.env`):
   Crea un archivo `.env` en `frontend/` y especifica la URL de tu backend:
   \`\`\`env
   VITE_API_URL=http://localhost:3000/api
   \`\`\`
4. Arrancar App React de Desarrollo:
   \`\`\`bash
   npm run dev
   \`\`\`
   _(El frontend arrancará típicamente en `http://localhost:5173` y se sincronizará con Vite en tiempo real)_

---

## 📚 Documentación Adicional

La documentación detallada sobre cómo opera el código y el manual de los usuarios está dividida metódicamente en la carpeta `/docs`:

- ⚙️ **Técnica (`/docs/technical`):**
  - [Arquitectura (ARCHITECTURE.md)](docs/technical/ARCHITECTURE.md)
  - [Modelo de BD (DATABASE_SCHEMA.md)](docs/technical/DATABASE_SCHEMA.md)
  - [Referencia API (API_REFERENCE.md)](docs/technical/API_REFERENCE.md)
  - [Reglas de Seguridad (SECURITY_CONFIG.md)](docs/technical/SECURITY_CONFIG.md)
- 📖 **Manuales (`/docs/manuals`):**
  - [Para Pacientes (USER_MANUAL_PATIENT.md)](docs/manuals/USER_MANUAL_PATIENT.md)
  - [Para Doctores (USER_MANUAL_DOCTOR.md)](docs/manuals/USER_MANUAL_DOCTOR.md)
  - [Para Administradores (ADMIN_MANUAL.md)](docs/manuals/ADMIN_MANUAL.md)
- 🚀 **Operativa (`/docs/ops`):**
  - [Pasos para Producción (DEPLOYMENT.md)](docs/ops/DEPLOYMENT.md)

---

> **Diseñado con pasión para mejorar el acceso a los servicios de salud mental a través de una experiencia técnica fluida y premium.**
