import { create } from 'zustand';
import api from '../api/axiosConfig';

export const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('mindpath_user')) || null,
    token: localStorage.getItem('mindpath_token') || null,
    isAuthenticated: !!localStorage.getItem('mindpath_token'),
    isLoading: false,
    error: null,

    // ── Login tradicional (email + contraseña) ──────────────────────
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('mindpath_token', token);
            localStorage.setItem('mindpath_user', JSON.stringify(user));

            set({ user, token, isAuthenticated: true, isLoading: false });
            return { success: true, role: user.role };
        } catch (error) {
            const message = error.response?.data?.message || 'Error al conectar con el servidor';
            const isGoogleAccount = error.response?.data?.isGoogleAccount || false;
            set({ isLoading: false, error: message });
            return { success: false, isGoogleAccount };
        }
    },

    // ── Login con Google (Paso 1: verificar si existe) ──────────────
    loginWithGoogle: async (credential, navigate) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/google-check', { credential });
            const data = response.data;

            if (data.exists) {
                // Usuario ya existe → login directo
                const { token, user } = data;
                localStorage.setItem('mindpath_token', token);
                localStorage.setItem('mindpath_user', JSON.stringify(user));
                set({ user, token, isAuthenticated: true, isLoading: false });
                return { success: true, role: user.role };
            } else {
                // Usuario nuevo → guardar datos de Google y redirigir al formulario
                sessionStorage.setItem('google_pending_data', JSON.stringify(data.googleData));
                set({ isLoading: false });
                navigate('/completar-perfil');
                return { success: false, redirect: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Error al iniciar sesión con Google';
            set({ isLoading: false, error: message });
            return { success: false };
        }
    },

    // ── Cerrar sesión ───────────────────────────────────────────────
    logout: () => {
        localStorage.removeItem('mindpath_token');
        localStorage.removeItem('mindpath_user');
        sessionStorage.removeItem('google_pending_data');
        set({ user: null, token: null, isAuthenticated: false });
    },

    // ── Actualizar datos del usuario en el store y localStorage ─────
    updateUser: (updates) => {
        set((state) => {
            if (!state.user) return state;
            const newUser = { ...state.user, ...updates };
            localStorage.setItem('mindpath_user', JSON.stringify(newUser));
            return { user: newUser };
        });
    }
}));
