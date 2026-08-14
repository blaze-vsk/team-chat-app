import { create } from 'zustand';
import { api } from '../api';

export const useTeamStore = create((set) => ({
  teams: [],
  currentTeam: null,
  error: null,
  async fetchTeams() {
    try {
      const teams = await api('/teams');
      set({ teams, error: null });
      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },
  async fetchTeamDetails(teamId) {
    try {
      const currentTeam = await api(`/teams/${teamId}`);
      set({ currentTeam, error: null });
      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },
  async createTeam(name, description) {
    try {
      const team = await api('/teams', {
        method: 'POST',
        body: JSON.stringify({ name, description })
      });
      set((state) => ({ teams: [team, ...state.teams], error: null }));
      return { success: true, team };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  }
}));
