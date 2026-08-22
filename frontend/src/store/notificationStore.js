import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifications = response.data;
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Fetch notifications error:', error.message);
    }
  },

  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications];
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    set({ notifications, unreadCount });
  },

  markAsRead: async (notificationId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifications = get().notifications.map((n) => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Mark notification read error:', error.message);
    }
  },

  markAllAsRead: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifications = get().notifications.map((n) => ({ ...n, is_read: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      console.error('Mark all notifications read error:', error.message);
    }
  }
}));
