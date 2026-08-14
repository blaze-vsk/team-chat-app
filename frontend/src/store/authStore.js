import { create } from 'zustand';
import { api } from '../api';

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const persistSession = ({ token, user }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const useAuthStore = create((set) => ({
  user: storedUser(),
  async login(email, password) {
    try {
      const session = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      persistSession(session);
      set({ user: session.user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  async register(username, email, password) {
    try {
      const session = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });
      persistSession(session);
      set({ user: session.user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  async updateProfile({ username, avatar_url }) {
    try {
      const currentUser = storedUser();
      const user = await api(`/users/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ username, avatar_url })
      });
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  async logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Clearing the local session is still required if the request is unavailable.
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
  }
}));
