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
      let errMsg = 'Login failed';
      if (error.response?.data?.error) {
        errMsg = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
        errMsg = error.response.data.errors[0].msg;
      }
      return { success: false, error: errMsg };
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
      let errMsg = 'Registration failed';
      if (error.response?.data?.error) {
        errMsg = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
        errMsg = error.response.data.errors[0].msg;
      }
      return { success: false, error: errMsg };
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
