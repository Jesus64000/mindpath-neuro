// Constantes globales del cliente
// Centraliza URLs del backend para no hardcodear en cada componente
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
    (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:3000');

