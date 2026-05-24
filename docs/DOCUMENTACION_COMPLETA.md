# 📚 Documentación Completa — Mindpath Neuro

> Versión 2.0 | Última actualización: Mayo 2026

---

## Índice

1. [¿Qué es Mindpath Neuro?](#qué-es-mindpath-neuro)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [PWA — Aplicación Móvil](#pwa--aplicación-móvil)
8. [Roles de Usuario](#roles-de-usuario)
9. [Correo Electrónico](#correo-electrónico)
10. [Instalación Local](#instalación-local)
11. [Guía de Despliegue en Producción](#guía-de-despliegue-en-producción)
12. [Configuración de Google Cloud](#configuración-de-google-cloud)
13. [Variables de Entorno](#variables-de-entorno)
14. [Base de Datos](#base-de-datos)
15. [Seguridad](#seguridad)

---

## ¿Qué es Mindpath Neuro?

Mindpath Neuro es una **plataforma integral de telemedicina y gestión clínica** especializada en neurología y salud mental. Permite:

- Conectar pacientes con especialistas neurológicos
- Realizar videoconsultas en tiempo real
- Gestionar historiales clínicos completos
- Generar informes médicos con asistencia de Inteligencia Artificial
- Administrar agendas, citas y pagos
- Funcionar como aplicación móvil instalable (PWA)

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Navegador / App Móvil)         │
│                  React 19 + Vite + Tailwind CSS             │
│              PWA — Instalable en iOS y Android              │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST (JSON)
                        │ JWT en cabecera Authorization
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (API REST)                      │
│               Node.js + Express.js (Puerto 3000)            │
│  Auth · Doctores · Pacientes · Citas · IA · Reportes · Admin│
└──────────┬────────────────────────────────┬─────────────────┘
           │                                │
           ▼                                ▼
┌──────────────────────┐        ┌──────────────────────────┐
│   MySQL (mindpath_db)│        │   Servicios Externos     │
│   12+ tablas         │        │  - Google OAuth 2.0      │
│   Transacciones      │        │  - Groq AI (resúmenes)   │
│   Pool de conexiones │        │  - ZegoCloud (video)     │
└──────────────────────┘        │  - Gmail SMTP (correos)  │
                                └──────────────────────────┘
```

### Comunicación Frontend ↔ Backend

- Todas las peticiones van a `/api/*`
- El token JWT se envía en la cabecera: `Authorization: Bearer <token>`
- El token tiene validez de **8 horas**
- Si el token expira, Axios redirige automáticamente al login

---

## Tecnologías Utilizadas

### Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.x | Interfaz de usuario (SPA) |
| Vite | 7.x | Bundler y servidor de desarrollo |
| Tailwind CSS | 3.x | Estilos con modo oscuro |
| Zustand | 5.x | Estado global (auth, configuración) |
| React Router DOM | 7.x | Navegación y rutas protegidas |
| Axios | 1.x | Cliente HTTP con interceptores |
| Lucide React | 0.5x | Íconos |
| Recharts | 3.x | Gráficos y estadísticas |
| @react-oauth/google | 0.x | Botón de login con Google |
| vite-plugin-pwa | 0.x | Convertir en PWA instalable |
| @zegocloud/zego-uikit-prebuilt | 2.x | Videollamadas WebRTC |
| @react-pdf/renderer | 4.x | Generación de reportes en PDF |

### Backend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 18+ | Entorno de ejecución |
| Express.js | 5.x | Framework HTTP |
| MySQL2 | 3.x | Base de datos relacional |
| JSON Web Tokens | 9.x | Autenticación stateless |
| Bcryptjs | 3.x | Cifrado de contraseñas |
| Nodemailer | 8.x | Envío de correos |
| Multer | 2.x | Subida de archivos |
| google-auth-library | — | Verificación tokens Google |
| PDFKit | 0.x | Generación de facturas PDF |
| Groq SDK | — | IA (resúmenes clínicos) |

---

## Estructura del Proyecto

```
mindpath-neuro/
├── backend/
│   ├── config/
│   │   └── db.js                    # Conexión MySQL con pool
│   ├── controllers/
│   │   ├── authController.js        # Login, Registro, Google Auth, Recuperación
│   │   ├── doctorController.js      # Perfil, horarios, pacientes del doctor
│   │   ├── patientController.js     # Perfil del paciente
│   │   ├── appointmentController.js # CRUD de citas
│   │   ├── bookingController.js     # Reserva de citas por pacientes
│   │   ├── consultationController.js# Consultas activas / sala de video
│   │   ├── reportController.js      # Informes médicos con IA
│   │   ├── adminController.js       # Panel de administración
│   │   ├── iaController.js          # Integración Groq AI
│   │   ├── scheduleController.js    # Configuración de agenda del doctor
│   │   ├── uploadController.js      # Subida de imágenes y archivos
│   │   └── ratingController.js      # Valoraciones y reseñas
│   ├── middlewares/
│   │   └── authMiddleware.js        # Verificación de JWT por ruta
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth/*
│   │   ├── doctorRoutes.js          # /api/doctors/*
│   │   ├── patientRoutes.js         # /api/patients/*
│   │   ├── appointmentRoutes.js     # /api/appointments/*
│   │   ├── bookingRoutes.js         # /api/bookings/*
│   │   ├── consultationRoutes.js    # /api/consultations/*
│   │   ├── reportRoutes.js          # /api/reports/*
│   │   ├── adminRoutes.js           # /api/admin/*
│   │   ├── iaRoutes.js              # /api/ia/*
│   │   ├── scheduleRoutes.js        # /api/schedules/*
│   │   ├── uploadRoutes.js          # /api/upload/*
│   │   └── ratingRoutes.js          # /api/ratings/*
│   ├── utils/
│   │   ├── emailService.js          # Envío de correos (recuperación, notificaciones)
│   │   ├── encryption.js            # Cifrado AES-256 para contraseñas SMTP
│   │   └── invoiceService.js        # Generación de facturas
│   ├── migrations/                  # Scripts de migración de BD
│   ├── public/uploads/              # Archivos subidos (avatares, logos)
│   ├── server.js                    # Punto de entrada del servidor
│   ├── setupDB.js                   # Instalación automática de BD
│   └── .env                         # Variables de entorno (NO subir a Git)
│
├── frontend/
│   ├── public/
│   │   └── icons/                   # Íconos PWA (192x192, 512x512)
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosConfig.js       # Cliente HTTP con interceptor JWT
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # HOC de rutas privadas por rol
│   │   │   ├── DoctorCard.jsx       # Tarjeta de doctor en el directorio
│   │   │   ├── ReportPDF.jsx        # Componente de informe PDF
│   │   │   ├── ScheduleManager.jsx  # Gestión visual de horarios
│   │   │   ├── UploadProofModal.jsx # Modal para subir comprobantes de pago
│   │   │   ├── ui/
│   │   │   │   └── Avatar.jsx       # Componente de avatar con iniciales
│   │   │   └── admin/               # Componentes del panel admin
│   │   ├── hooks/                   # Custom hooks reutilizables
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx  # Layout principal con sidebar y topbar
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Pantalla de inicio de sesión
│   │   │   ├── auth/
│   │   │   │   ├── Register.jsx     # Registro tradicional (paciente/doctor)
│   │   │   │   ├── CompletarPerfil.jsx # Completar perfil después de Google
│   │   │   │   ├── ForgotPassword.jsx  # Solicitar recuperación
│   │   │   │   └── ResetPassword.jsx   # Nueva contraseña con token
│   │   │   ├── patient/             # Páginas del paciente
│   │   │   ├── doctor/              # Páginas del doctor
│   │   │   └── admin/               # Páginas del administrador
│   │   ├── store/
│   │   │   ├── useAuthStore.js      # Estado de autenticación (Zustand)
│   │   │   └── useSettingsStore.js  # Configuración del sistema (tema, logo)
│   │   ├── App.jsx                  # Router principal con todas las rutas
│   │   └── main.jsx                 # Punto de entrada React
│   ├── index.html                   # HTML base con metas PWA
│   ├── vite.config.js               # Configuración Vite + PWA plugin
│   └── .env                         # Variables de entorno frontend
│
└── docs/                            # Documentación
```

---

## Módulos y Funcionalidades

### Para el Paciente
- **Inicio** → Panel con próximas citas, accesos rápidos
- **Mis Citas** → Lista de citas pasadas y futuras, opción de cancelar
- **Directorio de Doctores** → Buscar especialistas por especialidad, valoraciones
- **Perfil del Doctor** → Ver horarios disponibles y reservar cita
- **Videoconsulta** → Sala de videoconferencia integrada con ZegoCloud
- **Historial Clínico** → Ver informes médicos generados por el doctor
- **Mi Perfil** → Editar datos, foto de perfil, contraseña

### Para el Doctor
- **Panel** → Resumen del día: citas de hoy, estadísticas rápidas
- **Pacientes** → Lista de pacientes atendidos, ficha clínica completa
- **Agenda** → Calendario de citas (vista semanal/mensual)
- **Estadísticas** → Gráficos de ingresos, citas, valoraciones
- **Laboratorio de IA** → Asistente para generar notas SOAP con Groq
- **Sala de Consulta** → Vista previa antes de la videollamada
- **Videoconsulta** → Sala de video con ZegoCloud
- **Cierre de Consulta** → Registrar diagnóstico y notas post-consulta
- **Editor de Informes** → Crear y firmar informes médicos en PDF
- **Configuración de Agenda** → Definir horarios, vacaciones, duración de citas
- **Mi Perfil** → Editar datos profesionales, métodos de pago, foto

### Para el Administrador
- **Panel de Administración** → Vista global del sistema
  - Gestión de usuarios (activar/suspender)
  - Configuración de la plataforma (nombre, logo, colores)
  - Configuración SMTP para correos
  - Gestión de especialidades médicas
  - Gestión de clínicas/centros de salud
  - Métodos de pago disponibles
  - Registro de reembolsos
  - Estadísticas globales

---

## Sistema de Autenticación

### Método 1: Login Tradicional (Email + Contraseña)

```
POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, full_name, role, email, profile_picture } }
```

- La contraseña se almacena con **Bcrypt** (10 rondas de salt)
- El JWT se firma con `JWT_SECRET` y expira en **8 horas**
- El token se guarda en `localStorage` con la clave `mindpath_token`

### Método 2: Login con Google OAuth 2.0 (Flujo en 2 pasos)

#### Paso 1 — Verificar si existe la cuenta

```
POST /api/auth/google-check
Body: { credential }  ← Token ID de Google
```

**Si el usuario YA existe:**
```json
{ "exists": true, "token": "jwt...", "user": { ... } }
```
→ Login directo al panel correspondiente

**Si el usuario NO existe:**
```json
{ "exists": false, "googleData": { "email": "...", "name": "...", "picture": "...", "google_id": "..." } }
```
→ Se guarda en `sessionStorage` y redirige a `/completar-perfil`

#### Paso 2 — Completar el perfil

Pantalla `/completar-perfil` con:
- Nombre y correo pre-llenados (solo lectura, vienen de Google)
- Elección de rol: **Paciente** o **Doctor**
- Campos específicos del rol elegido
- Sin campo de contraseña (la cuenta es de Google)

```
POST /api/auth/google-complete
Body: { google_id, email, full_name, role, ...camposPorRol }
```
→ Crea el usuario en BD → Genera JWT → Redirige al panel

### Método 3: Recuperación de Contraseña

```
POST /api/auth/forgot-password
Body: { email }
→ Envía correo con token único (válido 1 hora)

POST /api/auth/reset-password
Body: { token, newPassword }
→ Actualiza contraseña y anula el token
```

> ⚠️ Los usuarios registrados con Google no tienen contraseña. Si intentan recuperarla, ven el mensaje: *"Tu cuenta está vinculada a Google. Usa el botón 'Continuar con Google' para acceder."*

---

## PWA — Aplicación Móvil

Mindpath Neuro es una **Progressive Web App (PWA)**. Esto significa que los usuarios pueden instalarla en su dispositivo como si fuera una app nativa descargada desde una tienda.

### Cómo instalarla

**En Android (Chrome):**
1. Abre la plataforma en Chrome
2. Aparece un banner en la parte inferior: *"Agregar Mindpath a la pantalla de inicio"*
3. Toca **Instalar**

**En iOS (Safari):**
1. Abre la plataforma en Safari
2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba)
3. Selecciona **"Agregar a pantalla de inicio"**

**En escritorio (Chrome/Edge):**
1. Aparece un ícono de instalación (⊕) en la barra de direcciones
2. Haz clic e instala

### Características de la PWA

| Característica | Descripción |
|----------------|-------------|
| Instalable | Sin necesidad de App Store ni Google Play |
| Icono en pantalla | Ícono de Mindpath en la pantalla de inicio |
| Pantalla completa | Sin barra del navegador (como app nativa) |
| Caché offline | Las páginas visitadas cargan aunque no haya internet |
| Actualizaciones automáticas | Se actualiza sola cuando hay cambios en el servidor |

---

## Roles de Usuario

| Rol | Descripción | Ruta de inicio |
|-----|-------------|---------------|
| `patient` | Paciente registrado | `/patient/dashboard` |
| `doctor` | Especialista médico | `/doctor/dashboard` |
| `admin` | Administrador del sistema | `/admin/dashboard` |
| `supervisor` | Supervisor con acceso al panel admin | `/admin/dashboard` |

Las rutas están protegidas por `ProtectedRoute`. Si un usuario intenta acceder a una ruta de otro rol, es redirigido a `/unauthorized`.

---

## Correo Electrónico

El sistema usa **Gmail SMTP** configurado dinámicamente desde el panel de administración. La contraseña SMTP se almacena **cifrada** en la BD con AES-256.

### Correos que envía el sistema

| Evento | Asunto |
|--------|--------|
| Recuperación de contraseña | 🔐 Restablecer tu contraseña — Mindpath Neuro |

### Configurar el SMTP (como Administrador)

1. Ir al **Panel de Administración**
2. Sección **Configuración del Sistema**
3. Completar: correo Gmail y contraseña de aplicación de Google
4. Guardar

> 💡 Para Gmail, debes crear una **Contraseña de Aplicación** en tu cuenta Google (no es tu contraseña normal). Ve a: Cuenta de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación.

---

## Instalación Local

### Requisitos

- Node.js v18, v20 o v22
- MySQL (XAMPP, WAMP o nativo) corriendo en el puerto 3306
- Git

### Paso a Paso

#### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd mindpath-neuro
```

#### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crea el archivo `backend/.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mindpath_db
DB_PORT=3306

# Seguridad
JWT_SECRET=tu_secreto_super_seguro_min_32_chars
ENCRYPTION_KEY=MindpathSecr3tK3y!2026@NeuroApp$

# Inteligencia Artificial
GROQ_API_KEY=tu_api_key_de_groq

# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

#### 3. Crear la Base de Datos

```bash
node setupDB.js
```

> Este script crea la BD automáticamente con todas las tablas, índices y datos iniciales.
> **Credenciales iniciales:** `admin@admin.com` / `admin123`

#### 4. Iniciar el Backend

```bash
npm run dev
# Backend corriendo en http://localhost:3000
```

#### 5. Configurar el Frontend

```bash
cd ../frontend
npm install
```

Crea el archivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_ZEGO_APP_ID=tu_app_id_numerico_de_zegocloud
VITE_ZEGO_SERVER_SECRET=tu_server_secret_de_zegocloud
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

#### 6. Iniciar el Frontend

```bash
npm run dev
# Frontend corriendo en http://localhost:5173
```

---

## Guía de Despliegue en Producción

### Opción A — Servidor VPS (Recomendada)

**Infraestructura sugerida:**
- Ubuntu 22.04 LTS
- 2 vCPU, 4 GB RAM mínimo
- Nginx como proxy inverso
- PM2 para mantener el backend corriendo

#### 1. Preparar el servidor

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (gestor de procesos)
npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

#### 2. Configurar MySQL en producción

```sql
CREATE DATABASE mindpath_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mindpath_user'@'localhost' IDENTIFIED BY 'contraseña_segura';
GRANT ALL PRIVILEGES ON mindpath_db.* TO 'mindpath_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. Clonar y configurar el proyecto

```bash
git clone <url-del-repositorio> /var/www/mindpath
cd /var/www/mindpath/backend
npm install --production

# Crear el .env de producción
nano .env
```

Variables de entorno para producción:
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_USER=mindpath_user
DB_PASSWORD=contraseña_segura
DB_NAME=mindpath_db
JWT_SECRET=secreto_muy_largo_y_aleatorio_para_produccion
ENCRYPTION_KEY=clave_32_chars_para_produccion!!!
GROQ_API_KEY=tu_api_key
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

```bash
node setupDB.js
```

#### 4. Iniciar el Backend con PM2

```bash
pm2 start server.js --name "mindpath-backend"
pm2 save
pm2 startup  # Para que arranque automáticamente con el sistema
```

#### 5. Compilar el Frontend

```bash
cd /var/www/mindpath/frontend
npm install
```

Crear `frontend/.env` de producción:
```env
VITE_API_URL=https://tudominio.com/api
VITE_ZEGO_APP_ID=tu_app_id
VITE_ZEGO_SERVER_SECRET=tu_secret
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

```bash
npm run build
# Los archivos compilados quedan en frontend/dist/
```

#### 6. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/mindpath
```

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend (archivos estáticos compilados)
    location / {
        root /var/www/mindpath/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;  # Para React Router
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Archivos subidos (avatares, logos)
    location /uploads/ {
        proxy_pass http://localhost:3000;
    }

    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mindpath /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Certificado SSL (HTTPS) — Obligatorio para PWA y Google Auth

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
# Sigue las instrucciones en pantalla
```

> ⚠️ **IMPORTANTE**: Google Auth y la instalación de la PWA **requieren HTTPS**. Sin certificado SSL no funcionarán.

---

### Opción B — Railway / Render (Sin servidor propio)

Estas plataformas permiten desplegar sin administrar un VPS:

**Backend en Railway:**
1. Crear cuenta en [railway.app](https://railway.app)
2. Nuevo proyecto → Deploy desde GitHub
3. Agregar servicio MySQL
4. Configurar variables de entorno en la interfaz
5. Railway asigna URL automática

**Frontend en Vercel / Netlify:**
1. Conectar repositorio de GitHub
2. Configurar: Build Command: `npm run build`, Output Directory: `dist`
3. Agregar variables de entorno
4. Deploy automático con cada push

---

## Configuración de Google Cloud

Para que el botón **"Continuar con Google"** funcione, necesitas un **Client ID** de OAuth 2.0. Es gratuito.

### Paso 1 — Crear el proyecto

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Haz clic en el selector de proyectos (arriba a la izquierda)
3. Clic en **"Nuevo Proyecto"**
4. Nombre: `Mindpath Neuro`
5. Clic en **Crear**

### Paso 2 — Configurar la pantalla de consentimiento

1. En el menú lateral: **APIs y servicios → Pantalla de consentimiento de OAuth**
2. Tipo de usuario: **Externo** → Clic en **Crear**
3. Completa los campos:
   - Nombre de la aplicación: `Mindpath Neuro`
   - Correo de soporte: tu correo
   - Logotipo: opcional (el logo de Mindpath)
   - Dominio de la aplicación: `tudominio.com`
   - Correo del desarrollador: tu correo
4. Clic en **Guardar y continuar**
5. En **Permisos**: no agregar nada especial, clic en **Guardar y continuar**
6. En **Usuarios de prueba** (opcional): agrega tu correo para pruebas
7. Clic en **Guardar y continuar** → **Volver al panel**

### Paso 3 — Crear las credenciales OAuth

1. En el menú lateral: **APIs y servicios → Credenciales**
2. Clic en **Crear credenciales → ID de cliente OAuth**
3. Tipo de aplicación: **Aplicación web**
4. Nombre: `Mindpath Web Client`
5. **Orígenes de JavaScript autorizados** — agrega:
   - `http://localhost:5173` (para desarrollo)
   - `https://tudominio.com` (para producción)
6. **URI de redireccionamiento autorizados** — agrega:
   - `http://localhost:5173`
   - `https://tudominio.com`
7. Clic en **Crear**
8. Se muestra el **ID de cliente** → cópialo

### Paso 4 — Configurar en el proyecto

En `backend/.env`:
```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

En `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

> 💡 **El ID de cliente es el mismo** para frontend y backend. Solo el frontend lo muestra en el botón y el backend lo usa para verificar los tokens de Google.

### Paso 5 — Publicar la aplicación (para usuarios reales)

Mientras la app está en modo **Testing**, solo pueden entrar los correos que agregaste en "Usuarios de prueba". Para abrirla al público:

1. Ve a **Pantalla de consentimiento de OAuth**
2. Clic en **Publicar aplicación**
3. Si Google pide verificación (solo si pides permisos sensibles), sigue el proceso.
   - Para solo nombre, email y foto **no se requiere verificación**

---

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno | `development` / `production` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | *(vacío en local)* |
| `DB_NAME` | Nombre de la BD | `mindpath_db` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `JWT_SECRET` | Clave para firmar JWTs | Mín. 32 caracteres aleatorios |
| `ENCRYPTION_KEY` | Clave AES-256 para SMTP | Exactamente 32 caracteres |
| `GROQ_API_KEY` | API Key de Groq (IA) | `gsk_...` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | `xxxx.apps.googleusercontent.com` |

### Frontend (`frontend/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000/api` |
| `VITE_ZEGO_APP_ID` | App ID de ZegoCloud | Número entero |
| `VITE_ZEGO_SERVER_SECRET` | Secret de ZegoCloud | Cadena hexadecimal |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth | `xxxx.apps.googleusercontent.com` |

---

## Base de Datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema (todos los roles) |
| `doctors` | Datos profesionales de los doctores |
| `patients` | Datos clínicos de los pacientes |
| `appointments` | Citas médicas |
| `consultations` | Consultas activas/videollamadas |
| `reports` | Informes médicos generados |
| `doctor_schedules` | Horarios de disponibilidad |
| `doctor_payment_methods` | Métodos de cobro del doctor |
| `payment_method_catalog` | Catálogo de métodos de pago |
| `ratings` | Valoraciones de pacientes |
| `system_settings` | Configuración global (logo, SMTP, colores) |
| `specialties` | Especialidades médicas disponibles |
| `clinics` | Clínicas/centros de salud |

### Columnas de autenticación en `users`

```sql
id              INT PRIMARY KEY AUTO_INCREMENT
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255)              -- NULL para usuarios de Google
full_name       VARCHAR(255) NOT NULL
role            ENUM('patient','doctor','admin','supervisor')
google_id       VARCHAR(255) UNIQUE       -- ID de Google OAuth
auth_provider   ENUM('local','google')    -- Cómo se registró
reset_token     VARCHAR(255)              -- Para recuperación de contraseña
reset_token_expires DATETIME             -- Expiración del token
created_at      DATETIME DEFAULT NOW()
```

---

## Seguridad

### Medidas implementadas

| Área | Medida |
|------|--------|
| Contraseñas | Bcrypt con 10 rondas de salt |
| JWT | Firmado con secreto largo, expira en 8h |
| Google Auth | Verificación del token en servidor (no solo en frontend) |
| SMTP | Contraseña cifrada con AES-256 en la BD |
| Rutas | Cada endpoint verifica el JWT y el rol |
| Recuperación | Token de un solo uso, expira en 1 hora |
| Datos Google | El token de Google **nunca** se guarda en la BD |
| CORS | Configurado para aceptar solo orígenes conocidos |

### Recomendaciones para producción

1. **Cambiar el `JWT_SECRET`** por una cadena aleatoria de al menos 64 caracteres
2. **Cambiar la `ENCRYPTION_KEY`** por una clave aleatoria de exactamente 32 caracteres
3. **No subir `.env` a Git** — está en `.gitignore`
4. **Usar HTTPS siempre** — requerido para Google Auth y PWA
5. **Configurar CORS** en producción para aceptar solo tu dominio real
6. **Habilitar la verificación en 2 pasos** en la cuenta de Gmail SMTP

---

*Documentación generada para Mindpath Neuro v2.0 — Mayo 2026*
