import axios from 'axios';

let apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Red de seguridad: Si el usuario olvidó colocar http:// o https://, se lo agregamos automáticamente para evitar rutas relativas
if (apiURL && !apiURL.startsWith('http://') && !apiURL.startsWith('https://')) {
    apiURL = 'https://' + apiURL;
}

// Red de seguridad: Asegurar que la URL del backend siempre termine con /api
if (apiURL && !apiURL.endsWith('/api') && !apiURL.endsWith('/api/')) {
    apiURL = apiURL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
    baseURL: apiURL, // Ruta base de nuestro backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Se ejecuta ANTES de que la petición salga al backend
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('mindpath_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
