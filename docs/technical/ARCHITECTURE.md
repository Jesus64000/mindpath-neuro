# Arquitectura del Sistema (Mindpath Neuro)

Este documento detalla el stack tecnológico, el modelo funcional y la filosofía de desarrollo empleada para la construcción de **Mindpath Neuro**.

## 1. Patrón de Arquitectura

El sistema utiliza un modelo de arquitectura distribuida **Cliente/Servidor (Monolito SPA + API RESTful)**:

1.  **Capa de Presentación (Frontend SPA):** Construida con React (Vite) en modo _Single Page Application_. Esta capa maneja toda la UI, rutas de cliente y control de estado sin requerir renderizados del servidor (SSR), maximizando la velocidad de respuesta tras la primera carga.
2.  **Capa Lógica (Backend Node.js API):** Un servidor Node.js/Express.js que orquesta las reglas de negocio, procesa la IA, maneja el JWT y sirve como intermediario seguro a la base de datos.
3.  **Capa Persistente (Base de Datos):** Servidor MySQL local capaz de gestionar las relaciones complejas entre los actores (Médicos, Pacientes) y la trazabilidad (Citas, Informes Clínicos).

### Diagrama General

```mermaid
graph TD
    Client[Navegador del Usuario\nReact + Tailwind] <-->|JSON / Axios (https)| Server(Node.js / Express API Express)
    Server <-->|mysql2 (TCP/3306)| DB[(MySQL Relacional)]
    Server <-->|JWT| Auth[Middleware / Auth]
    Server <-->|HTTPS| Gemini[Google Gemini AI]
    Client <-->|WebRTC/Sockets| Zego[Red ZegoCloud\nTelemedicina]
```

## 2. Decisiones Tecnológicas Destacadas

### 🎨 Frontend

- **Tailwind CSS:** Se eligió sobre otros frameworks de UI (como Material UI o Bootstrap) porque permite un diseño a la medida (pixel-perfect) desde el HTML, reduciendo el tamaño del bundle CSS y facilitando un _Modo Oscuro_ nativo impecable.
- **Zustand:** Reemplaza a Redux. Manejo de estado global increíblemente ligero y veloz para conservar configuraciones estéticas y tokens sin exceso de repetitividad en el código.
- **Lucide React:** Iconografía escalable y moderna.

### ⚙️ Backend

- **Express + Axios:** Modular, predecible y rápido para manejar enrutadores segmentados (Routes -> Controllers).
- **ZegoCloud:** Integración de videollamadas con cero latencia local gracias a su capa de WebRTC manejada abstractamente, quitando el gran peso del servidor Node.js.
- **Gemini API:** Modelo generativo (GenAI) utilizado como un asistente pasivo dentro del proceso clínico del Doctor para traducir notas privadas a resúmenes tipo SOAP.

## 3. Estructura y Patrón del Código

Se siguió el modelo **MVC Modificado** (rutas + controladores + servicios), garantizando separación de preocupaciones (Separation of Concerns).

```text
mindpath-neuro/
├── backend/
│   ├── config/        # Credenciales de MySQL
│   ├── controllers/   # Lógica pura del modelo (ej. bookingController)
│   ├── middlewares/   # Interceptores para proteger flujos (JWT, Roles)
│   ├── routes/        # Mapeadores de URI a los endpoints
│   ├── uploads/       # Storage local de perfiles/PDFs
│   └── server.js      # Raíz del servidor Express
└── frontend/
    ├── src/
    │   ├── api/       # Configuración global de axios
    │   ├── components/# Botones, Cards, Modales reusables
    │   ├── pages/     # Componentes tipo "vista" completa
    │   └── store/     # Tiendas locales de estado (Zustand)
    └── App.jsx        # Enrutador cliente y protecciones
```

## 4. Filosofía de Evolución

La aplicación está programada de forma tan modular que la incorporación de un nuevo rol (ej. "Enfermera" o "Facturador") solo requiere duplicar una carpeta `/pages/role` y añadir su respectivo Middleware de backend.
