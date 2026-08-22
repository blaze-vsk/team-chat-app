import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useTeamStore = create((set, get) => ({
  teams: [],
  currentTeam: null,
  publicTeams: [],
  joinRequests: [],
  invitations: [],
  friendsToInvite: [],
  
  fetchTeams: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ teams: response.data });
    } catch (error) {
      console.error('Fetch teams error:', error.message);
    }
  },
  
  fetchTeamDetails: async (teamId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ currentTeam: response.data });
    } catch (error) {
      console.error('Fetch team details error:', error.message);
    }
  },
  
  createTeam: async (name, description, isPrivate = false, avatarUrl = '') => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.post(`${API_URL}/teams`, { name, description, isPrivate, avatarUrl }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newTeam = response.data;
      set({ teams: [...get().teams, newTeam] });
      return { success: true, team: newTeam };
    } catch (error) {
      console.error('Create team error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to create team' };
    }
  },

  updateTeamSettings: async (teamId, name, description, isPrivate, avatarUrl) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.put(`${API_URL}/teams/${teamId}/settings`, { name, description, isPrivate, avatarUrl }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ currentTeam: { ...get().currentTeam, ...response.data } });
      await get().fetchTeams();
      return { success: true };
    } catch (error) {
      console.error('Update team settings error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to update settings' };
    }
  },

  removeTeamMember: async (teamId, memberUserId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/teams/${teamId}/members/${memberUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (get().currentTeam?.id === teamId) {
        set({
          currentTeam: {
            ...get().currentTeam,
            members: get().currentTeam.members.filter((m) => m.id !== memberUserId)
          }
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Remove member error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to remove member' };
    }
  },

  discoverTeams: async (search = '') => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/teams/discover?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ publicTeams: response.data });
    } catch (error) {
      console.error('Discover teams error:', error.message);
    }
  },

  sendJoinRequest: async (teamId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.post(`${API_URL}/teams/${teamId}/join-request`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh discover to show updated status
      await get().discoverTeams();
      return response.data;
    } catch (error) {
      console.error('Send join request error:', error.message);
      return { error: error.response?.data?.error || 'Failed to send request' };
    }
  },

  fetchJoinRequests: async (teamId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/teams/${teamId}/join-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ joinRequests: response.data });
    } catch (error) {
      console.error('Fetch join requests error:', error.message);
    }
  },

  respondToJoinRequest: async (teamId, requestId, status) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/teams/${teamId}/join-requests/${requestId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ joinRequests: get().joinRequests.filter((r) => r.id !== requestId) });
      await get().fetchTeamDetails(teamId);
      return { success: true };
    } catch (error) {
      console.error('Respond to join request error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to respond' };
    }
  },

  sendInvitation: async (teamId, inviteeId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/teams/${teamId}/invite`, { inviteeId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ friendsToInvite: get().friendsToInvite.filter((f) => f.id !== inviteeId) });
      return { success: true };
    } catch (error) {
      console.error('Send invitation error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to send invitation' };
    }
  },

  fetchFriendsToInvite: async (teamId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/teams/${teamId}/friends-to-invite`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ friendsToInvite: response.data });
    } catch (error) {
      console.error('Fetch friends to invite error:', error.message);
    }
  },

  fetchInvitations: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/teams/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ invitations: response.data });
    } catch (error) {
      console.error('Fetch invitations error:', error.message);
    }
  },

  respondToInvitation: async (invitationId, status) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`${API_URL}/teams/invitations/${invitationId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ invitations: get().invitations.filter((i) => i.id !== invitationId) });
      await get().fetchTeams();
      return { success: true };
    } catch (error) {
      console.error('Respond to invitation error:', error.message);
      return { success: false, error: error.response?.data?.error || 'Failed to respond to invitation' };
    }
  }
}));
