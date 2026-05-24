// Constantes globales del cliente
// Centraliza URLs del backend para no hardcodear en cada componente
let rawApiUrl = import.meta.env.VITE_API_URL || '';

// Red de seguridad: Si falta el protocolo, lo agregamos
if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
    rawApiUrl = 'https://' + rawApiUrl;
}

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
    (rawApiUrl ? rawApiUrl.replace(/\/api$/, '') : 'http://localhost:3000');

