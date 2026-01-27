import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    // API returns { message, data: { user, token } }
                    const response = await api.post('/auth/login', { email, password });
                    const { user, token } = response.data;

                    set({ user, token, isLoading: false });
                    localStorage.setItem('token', token); // Sync manually for axios interceptor immediately
                    return user;
                } catch (error) {
                    const message = error.response?.data?.message || 'Login failed';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/register', data);
                    const { user, token } = response.data;

                    set({ user, token, isLoading: false });
                    localStorage.setItem('token', token);
                    return user;
                } catch (error) {
                    const message = error.response?.data?.message || 'Registration failed';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                set({ user: null, token: null });
                localStorage.removeItem('token');
            },

            // Helper to check if token is expired
            checkAuth: () => {
                const { token } = get();
                if (!token) return false;
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 < Date.now()) {
                        get().logout();
                        return false;
                    }
                    return true;
                } catch (e) {
                    get().logout();
                    return false;
                }
            }

        }),
        {
            name: 'auth-storage', // unique name
            partialize: (state) => ({ user: state.user, token: state.token }), // persist specific fields
        }
    )
);
