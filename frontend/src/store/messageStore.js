import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useMessageStore = create((set, get) => ({
  messages: [],
  socket: null,
  typingUsers: {}, // { [targetId]: username }
  activeRoom: null, // { type: 'channel'|'dm', id: string, teamId?: string }

  initSocket: (token) => {
    if (get().socket) return;

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('new_message', (message) => {
      const activeRoom = get().activeRoom;
      if (!activeRoom) return;

      const isCurrentChannel = activeRoom.type === 'channel' && message.channel_id === activeRoom.id;
      const isCurrentDM = activeRoom.type === 'dm' && message.conversation_id === activeRoom.id;

      if (isCurrentChannel || isCurrentDM) {
        set({ messages: [...get().messages, message] });
      }
    });

    socket.on('message_edited', (updatedMessage) => {
      set({
        messages: get().messages.map((m) =>
          m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
        )
      });
    });

    socket.on('message_deleted', ({ messageId }) => {
      set({
        messages: get().messages.filter((m) => m.id !== messageId)
      });
    });

    socket.on('reaction_updated', ({ messageId, reactions }) => {
      set({
        messages: get().messages.map((m) =>
          m.id === messageId ? { ...m, reactions } : m
        )
      });
    });

    socket.on('user_typing', ({ username, roomType, targetId, isTyping }) => {
      const activeRoom = get().activeRoom;
      if (!activeRoom || activeRoom.id !== targetId) return;

      const current = { ...get().typingUsers };
      if (isTyping) {
        current[username] = true;
      } else {
        delete current[username];
      }
      set({ typingUsers: current });
    });

    set({ socket });
  },

  setActiveRoom: (room) => {
    set({ activeRoom: room, messages: [], typingUsers: {} });
    const socket = get().socket;
    if (socket && room) {
      if (room.type === 'channel') {
        socket.emit('join_channel', { channelId: room.id, teamId: room.teamId });
      } else if (room.type === 'dm') {
        socket.emit('join_dm', { conversationId: room.id });
      }
    }
  },

  fetchChannelMessages: async (channelId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/messages/channel/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ messages: response.data });
    } catch (error) {
      console.error('Fetch channel messages error:', error.message);
    }
  },

  fetchDMMessages: async (conversationId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ messages: response.data });
    } catch (error) {
      console.error('Fetch DM messages error:', error.message);
    }
  },

  sendMessage: ({ teamId, channelId, conversationId, content, fileData, replyToId }) => {
    const socket = get().socket;
    if (socket) {
      if (conversationId) {
        socket.emit('send_dm_message', { conversationId, content, fileData, replyToId });
      } else if (channelId) {
        socket.emit('send_channel_message', { teamId, channelId, content, fileData, replyToId });
      }
    }
  },

  uploadFile: async (file) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data; // { fileUrl, fileName, fileSize, mimeType }
    } catch (error) {
      console.error('File upload error:', error.message);
      throw error;
    }
  },

  editMessage: async (messageId, content) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.put(`${API_URL}/messages/${messageId}`, { content }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Edit message error:', error.message);
    }
  },

  deleteMessage: async (messageId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Delete message error:', error.message);
    }
  },

  toggleReaction: async (messageId, emoji) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/messages/${messageId}/react`, { emoji }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Toggle reaction error:', error.message);
    }
  },

  sendTyping: (isTyping) => {
    const socket = get().socket;
    const activeRoom = get().activeRoom;
    if (socket && activeRoom) {
      socket.emit('typing', {
        roomType: activeRoom.type,
        targetId: activeRoom.id,
        isTyping
      });
    }
  }
}));
