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
   - Cuenta en **Groq Cloud** (Para el motor de IA de transcripción y generación de informes).
   - Cuenta en **ZEGOCLOUD** (Para el servicio de videollamadas).

---

## 💾 1. Configuración de la Base de Datos

El proyecto cuenta con un archivo maestro de base de datos que ya incluye todas las tablas, relaciones, roles predefinidos y configuraciones estéticas de la clínica.

1. Abre el panel de control de **XAMPP** y enciende los módulos **Apache** y **MySQL**.
2. Dirígete a **phpMyAdmin** desde tu navegador: `http://localhost/phpmyadmin`.
3. Haz clic en **Nueva** en la barra lateral izquierda para crear una nueva base de datos.
4. Nombra la base de datos exactamente como: `mindpath_db` y asegúrate de usar el cotejamiento `utf8mb4_general_ci`. Haz clic en **Crear**.
5. Selecciona la recién creada base de datos `mindpath_db`.
6. Ve a la pestaña **Importar** en el menú superior.
7. Haz clic en **Seleccionar archivo** y busca el archivo `mindpath_dbv2.sql` ubicado en la carpeta `docs/` del proyecto.
8. Desplázate hacia abajo y haz clic en **Importar** (o _Go_).

> **¡Listo!** Tu base de datos ahora contiene todas las tablas (pacientes, doctores, admin, historiales) listas para operar.

---

## ⚙️ 2. Configuración del Servidor Backend

El Backend es el cerebro que conecta la base de datos con tu aplicación y se encarga de hablar con la Inteligencia Artificial.

### 2.1. Instalación de dependencias

Abre una terminal, navega a la carpeta del backend y ejecuta el comando de instalación:

```bash
cd backend
npm install
npm install groq-sdk
```

### 2.2. Variables de Entorno (.env)

Dentro de la carpeta `backend/`, crea un archivo llamado `.env` (si no existe) basado en el archivo de ejemplo o agrega directamente las siguientes líneas. Rellena los datos faltantes con tus claves:

```env
# ── Servidor ──
PORT=3000

# ── Base de Datos (MySQL XAMPP) ──
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mindpath_db

# ── Seguridad (JWT) ──
JWT_SECRET=escribe_aqui_un_codigo_secreto_largo_y_dificil_de_adivinar_123!@#
JWT_EXPIRES_IN=7d

# ── Inteligencia Artificial (Groq IA) ──
GROQ_API_KEY=tu_api_key_de_groq_aqui
```

> **¿Cómo sacar la API Key de Groq?**
>
> 1. Ve a [console.groq.com](https://console.groq.com)
> 2. Inicia sesión o regístrate.
> 3. En el menú izquierdo, busca **API Keys** -> **Create API Key**.
> 4. Ponle nombre (ej. "MindPath") y copia el texto `gsk_...` generado para pegarlo en tu `.env`.

### 2.3. Ejecutar el Servidor

Para encender el servidor en modo desarrollo:

```bash
npm run dev
```

Deberías ver un mensaje que dice: `✅ Socio, Base de Datos conectada exitosamente a: mindpath_db` y `Servidor corriendo en el puerto 3000`.

---

## 🎨 3. Configuración del Frontend (Vista)

El Frontend es la cara de la aplicación y la sala de consultas. Dependerá de ZEGOCLOUD para poder emitir los videos en tiempo real.

### 3.1. Instalación de dependencias

Abre una **nueva** terminal (sin cerrar la del backend), navega a la carpeta de frontend e instala las librerías:

```bash
cd frontend
npm install
```

### 3.2. Variables de Entorno (.env)

Dentro de la carpeta `frontend/`, crea un archivo `.env` y coloca el siguiente contenido:

```env
VITE_API_URL=http://localhost:3000

# ── ZegoCloud (Videollamadas) ──
VITE_ZEGO_APP_ID=tu_app_id_numerico_aqui
VITE_ZEGO_SERVER_SECRET=tu_server_secret_alfanumerico_aqui
```

> **¿Cómo sacar las credenciales de ZEGOCLOUD?**
>
> 1. Ve a [console.zegocloud.com](https://console.zegocloud.com/).
> 2. Haz clic en **Create Project** -> Elige **Video / Voice Call**.
> 3. Al finalizar, irás a tu consola de proyecto. En el apartado lateral busca **Project Management**.
> 4. Copia tu `AppID` (es un número largo, ponlo en VITE_ZEGO_APP_ID).
> 5. Copia tu `ServerSecret` (escribelo en VITE_ZEGO_SERVER_SECRET).

### 3.3. Ejecutar la Web

Para encender el frontend:

```bash
npm run dev
```

La terminal mostrará que tu web está corriendo (usualmente en `http://localhost:5173/`).

---

## 👑 4. Creación de tu primer Usuario Administrador

Como acabamos de importar una base de datos fresca, para poder entrar al sistema es recomendable registrar la cuenta de administrador global.
Tienes dos opciones para crear el admin inicial:

### Opcion A: Usando Postman / ThunderClient

Haz una petición **POST** a `http://localhost:3000/api/auth/register` con el siguiente formato JSON en el interior del cuerpo (body):

```json
{
  "full_name": "Administrador Mindpath",
  "email": "admin@mindpath.com",
  "password": "PasswordSegura123!",
  "role": "admin"
}
```

### Opcion B: Directo desde Base de datos (Insersión Manual)

Dado que usas contraseñas hasheadas mediante `bcrypt`, para saltarte Postman tendrías que registrar un usuario paciente común desde la web interactiva, buscarlo en **phpMyAdmin**, apuntar a la tabla `users`, editar el renglón de ese paciente y cambiarle el campo `role` de `"patient"` a `"admin"`.

Al loguearte como `admin`, tendrás acceso al **Panel Administrativo Completo** para configurar reportes médicos, validar doctores y controlar toda la clínica.

---

## 🚀 5. Empaquetado para Producción

Si deseas subir el proyecto a la nube (ej. Hostinger, Render, Vercel), asegúrate de hacer el build de react:

```bash
cd frontend
npm run build
```

Esto generará una carpeta `dist/` en el frontend completamente empaquetada y optimizada en HTML, CSS y JS puro que podrás alojar de manera estática en cualquier lugar.

---

_Fin del Manual de MindPath Neuro. ¡Mucho éxito en la gestión clínica digital!_
