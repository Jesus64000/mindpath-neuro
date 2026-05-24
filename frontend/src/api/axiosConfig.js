import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Ruta base de nuestro backend
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
