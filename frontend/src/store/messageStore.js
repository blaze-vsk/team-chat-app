import { create } from 'zustand';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from '../api';

export const useMessageStore = create((set, get) => ({
  messages: [],
  socket: null,
  error: null,
  initSocket() {
    const token = localStorage.getItem('token');
    const existingSocket = get().socket;
    if (!token) return null;
    if (existingSocket?.connected) return existingSocket;

    existingSocket?.disconnect();
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('message_received', (message) => {
      set((state) => state.messages.some((item) => item.id === message.id)
        ? state
        : { messages: [...state.messages, message] });
    });
    socket.on('connect_error', (error) => set({ error: error.message || 'Chat connection failed' }));
    set({ socket });
    return socket;
  },
  async fetchMessages(teamId) {
    try {
      const messages = await api(`/messages/team/${teamId}`);
      set({ messages, error: null });
      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },
  joinTeam(teamId) {
    get().socket?.emit('join_team', { teamId });
  },
  leaveTeam(teamId) {
    get().socket?.emit('leave_team', { teamId });
  },
  sendMessage(teamId, content) {
    if (!content.trim()) return;
    get().socket?.emit('send_message', { teamId, content: content.trim(), type: 'text' });
  },
  disconnect() {
    get().socket?.disconnect();
    set({ socket: null, messages: [] });
  }
}));
