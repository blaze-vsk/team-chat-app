import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useChannelStore = create((set, get) => ({
  channels: [],
  currentChannel: null,
  loading: false,

  fetchChannels: async (teamId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/teams/${teamId}/channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const channels = response.data;
      set({ 
        channels, 
        currentChannel: channels.find((c) => c.name === 'general') || channels[0] || null,
        loading: false 
      });
    } catch (error) {
      console.error('Fetch channels error:', error.message);
      set({ loading: false });
    }
  },

  setCurrentChannel: (channel) => {
    set({ currentChannel: channel });
  },

  createChannel: async (teamId, name, description = '') => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.post(`${API_URL}/teams/${teamId}/channels`, { name, description }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newChannel = response.data;
      set({ 
        channels: [...get().channels, newChannel],
        currentChannel: newChannel
      });
      return { success: true, channel: newChannel };
    } catch (error) {
      console.error('Create channel error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to create channel' };
    }
  },

  renameChannel: async (teamId, channelId, name) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.put(`${API_URL}/teams/${teamId}/channels/${channelId}`, { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedChannel = response.data;
      set({
        channels: get().channels.map((c) => c.id === channelId ? updatedChannel : c),
        currentChannel: get().currentChannel?.id === channelId ? updatedChannel : get().currentChannel
      });
      return { success: true };
    } catch (error) {
      console.error('Rename channel error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to rename channel' };
    }
  },

  deleteChannel: async (teamId, channelId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/teams/${teamId}/channels/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedChannels = get().channels.filter((c) => c.id !== channelId);
      set({
        channels: updatedChannels,
        currentChannel: get().currentChannel?.id === channelId ? updatedChannels[0] || null : get().currentChannel
      });
      return { success: true };
    } catch (error) {
      console.error('Delete channel error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to delete channel' };
    }
  }
}));
