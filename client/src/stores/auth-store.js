import { create } from 'zustand';
import { api } from '../api/index.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('campusflow_token') || null,
  portals: [],
  defaultPortal: null,
  redirectPath: '/agent',
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login({ email, password });
      if (res?.data?.token) {
        const { token, user, access } = res.data;
        localStorage.setItem('campusflow_token', token);
        set({
          user,
          token,
          portals: access?.portals || ['student_agent'],
          defaultPortal: access?.defaultPortal || 'student_agent',
          redirectPath: access?.redirectPath || '/agent',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, redirectPath: access?.redirectPath || '/agent' };
      }
      throw new Error(res?.message || 'Login failed');
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  logout: () => {
    localStorage.removeItem('campusflow_token');
    set({
      user: null,
      token: null,
      portals: [],
      defaultPortal: null,
      redirectPath: '/login',
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  switchPersona: async (roleName) => {
    set({ isLoading: true });
    try {
      const res = await api.auth.demoSwitch(roleName);
      if (res?.data?.token) {
        const { token, user, access } = res.data;
        localStorage.setItem('campusflow_token', token);
        set({
          user,
          token,
          portals: access?.portals || ['student_agent'],
          defaultPortal: access?.defaultPortal || 'student_agent',
          redirectPath: access?.redirectPath || '/agent',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, redirectPath: access?.redirectPath || '/agent' };
      }
    } catch (err) {
      console.warn('Switch persona error:', err.message);
      set({ isLoading: false });
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('campusflow_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await api.auth.me();
      if (res?.data) {
        const user = res.data;
        const access = user.access || {};
        set({
          user,
          portals: access.portals || ['student_agent'],
          defaultPortal: access.defaultPortal || 'student_agent',
          redirectPath: access.redirectPath || '/agent',
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        get().logout();
      }
    } catch (err) {
      console.warn('initAuth failed, clearing session:', err.message);
      get().logout();
    }
  },
}));
