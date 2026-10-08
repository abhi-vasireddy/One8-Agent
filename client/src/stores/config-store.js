import { create } from 'zustand';
import { api } from '../api/index.js';

export const useConfigStore = create((set, get) => ({
  pipelines: [],
  currentPipeline: null,
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchPipelines: async () => {
    set({ isLoading: true });
    try {
      const res = await api.pipelines.list();
      const list = res?.data || [];
      set({
        pipelines: list,
        currentPipeline: get().currentPipeline || list[0] || null,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch pipelines:', err);
      set({ isLoading: false });
    }
  },

  setCurrentPipeline: (pipeline) => set({ currentPipeline: pipeline }),

  fetchNotifications: async () => {
    try {
      const res = await api.notifications.list();
      const list = res?.data || [];
      const unread = list.filter(n => !n.isRead).length;
      set({ notifications: list, unreadCount: unread });
    } catch (err) {
      // Ignore
    }
  },

  markNotificationRead: async (id) => {
    try {
      await api.notifications.markRead(id);
      set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      // Ignore
    }
  },
}));
