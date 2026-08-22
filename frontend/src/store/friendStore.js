import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useFriendStore = create((set, get) => ({
  friends: [],
  searchResults: [],
  incomingRequests: [],
  outgoingRequests: [],
  loading: false,

  fetchFriends: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/friends/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ friends: response.data });
    } catch (error) {
      console.error('Fetch friends error:', error.message);
    }
  },

  searchUsers: async (searchTerm) => {
    if (!searchTerm.trim()) {
      set({ searchResults: [] });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/friends/search/${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ searchResults: response.data, loading: false });
    } catch (error) {
      console.error('Search users error:', error.message);
      set({ loading: false });
    }
  },

  fetchRequests: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({
        incomingRequests: response.data.incoming,
        outgoingRequests: response.data.outgoing
      });
    } catch (error) {
      console.error('Fetch requests error:', error.message);
    }
  },

  sendFriendRequest: async (receiverId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/friends/request`, { receiverId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().fetchRequests();
      return { success: true };
    } catch (error) {
      console.error('Send friend request error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to send friend request' };
    }
  },

  acceptRequest: async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/friends/request/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().fetchRequests();
      await get().fetchFriends();
      return { success: true };
    } catch (error) {
      console.error('Accept request error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to accept request' };
    }
  },

  rejectRequest: async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/friends/request/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().fetchRequests();
      return { success: true };
    } catch (error) {
      console.error('Reject request error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to reject request' };
    }
  },

  cancelRequest: async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/friends/request/${requestId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().fetchRequests();
      return { success: true };
    } catch (error) {
      console.error('Cancel request error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to cancel request' };
    }
  },

  removeFriend: async (friendId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().fetchFriends();
      return { success: true };
    } catch (error) {
      console.error('Remove friend error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to remove friend' };
    }
  }
}));
