import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  },
  
  register: async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data, token });
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null });
      return false;
    }
  },

  updateProfile: async (data) => {
    const token = get().token;
    const userId = get().user?.id;
    if (!token || !userId) return { success: false, error: 'Unauthorized' };

    try {
      const response = await axios.put(`${API_URL}/users/${userId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: { ...get().user, ...response.data } });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Profile update failed' };
    }
  }
}));
