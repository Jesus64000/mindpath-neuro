import { create } from 'zustand';
import api from '../api/axiosConfig';

export const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('mindpath_user')) || null,
    token: localStorage.getItem('mindpath_token') || null,
    isAuthenticated: !!localStorage.getItem('mindpath_token'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            // Persistencia en LocalStorage
            localStorage.setItem('mindpath_token', token);
            localStorage.setItem('mindpath_user', JSON.stringify(user));

            set({ user, token, isAuthenticated: true, isLoading: false });
            return { success: true, role: user.role };
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || 'Error al conectar con el servidor' 
            });
            return { success: false };
        }
    },

    logout: () => {
        localStorage.removeItem('mindpath_token');
        localStorage.removeItem('mindpath_user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    updateUser: (updates) => {
        set((state) => {
            if (!state.user) return state;
            const newUser = { ...state.user, ...updates };
            localStorage.setItem('mindpath_user', JSON.stringify(newUser));
            return { user: newUser };
        });
    }
}));
