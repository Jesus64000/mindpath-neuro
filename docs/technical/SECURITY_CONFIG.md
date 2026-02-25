# Configuración de Seguridad y Middlewares

La seguridad en **Mindpath Neuro** corre a cargo del interceptor en Node.js que procesa un _JSON Web Token_ (JWT). La plataforma es una API sin estado (stateless) para máxima escalabilidad, por lo tanto no usamos cookies nativas de sesión entre peticiones.

## 1. El Token de Acceso (JWT)

A la hora del _Login_ o _Register_, el servidor envía al frontend un string JWT que firma mediante el archivo de environment (`process.env.JWT_SECRET`).

El **Payload** base del Token lleva la información esencial del perfil:

- `id`: (Integer del perfil en la base de datos `users.id`).
- `email`: (String).
- `role`: (Enum; de aquí parte toda la ramificación visual en React).

El Frontend guarda este Token en el **Local Storage** de Zustand (`useAuthStore`) y se inyecta pasivamente a cada posterior petición usando la cabecera `Authorization: Bearer <TOKEN>`.

---

## 2. Middlewares de Node.js

Las rutas cerradas de _Express.js_ (`server.js`) están cubiertas por los siguientes interceptores secuenciales:

### A) `authMiddleware.js`

1. Revisa si en `req.headers.authorization` existe un Token.
2. Si no, `401 Unauthorized` (Log in Out automático).
3. Desencripta el token y busca el ID subyacente de `users`.
4. Clava al usuario en `req.user`. Permite el cruce al flujo central del controlador.

### B) `isDoctorMiddleware.js`

Validado de que en adición a existir, el Payload original (`req.user.role`) debe ser igual a `'doctor'`.

### C) `isSuperAdminMiddleware.js` / `isAdminMiddleware.js`

Solo deja pasar roles tipo `'admin'` o `'supervisor'`. Esto lo usamos principalmente para la vista de validación de los médicos y reportes de la gerencia del hospital. Protege `adminRoutes.js`.

---

## 3. Seguridad de Videoconferencias (ZegoCloud)

A diferencia del flujo de datos del usuario, el Streaming de audio/video **NO** fluye por el servidor central de Node. Es una conexión Peer to Peer enrutada por _ZegoCloud_.

**¿Cómo funciona la autenticación de la sala?**

1. Doctores y pacientes comparten el mismo `roomID` (El cual es programáticamente generado en el frontend combinando su ID de Cita `appointment_id`).
2. Se les entrega un link seguro `/doctor/video-room/35` y `/patient/video-room/35`.
3. Ambos clientes calculan un Server Secret local o externo y entran al websocket oficial de ZegoCloud de manera ensobrada usando la aplicación Vite. No puede haber invitados al cuarto virtual (solo hay soporte para un Host [Doctor] y el Invitee [Paciente]).
