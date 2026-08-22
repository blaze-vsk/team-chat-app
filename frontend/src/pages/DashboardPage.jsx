import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';
import NotificationBell from '../components/NotificationBell';
import FriendsView from '../components/FriendsView';
import DiscoverTeamsView from '../components/DiscoverTeamsView';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { teams, fetchTeams, createTeam } = useTeamStore();
  
  const [activeNav, setActiveNav] = useState('teams'); // 'teams' | 'friends' | 'discover'
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createTeam(teamName, teamDesc, isPrivate);
    setTeamName('');
    setTeamDesc('');
    setIsPrivate(false);
    setShowCreateTeam(false);
    await fetchTeams();
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Top Header Navbar */}
      <div className="glass-panel border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-btn rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
              TC
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Team Chat
              </h1>
              <p className="text-[10px] text-indigo-300/80 font-bold tracking-widest uppercase">Workspace Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <div className="w-9 h-9 gradient-btn rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-white font-semibold text-sm leading-none mb-0.5">
                  {user?.username}
                </span>
                <span className="text-xs text-gray-400 leading-none">Active</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="text-sm text-gray-300 hover:text-white font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Settings
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500/15 border border-red-500/30 text-red-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/25 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full flex flex-col md:flex-row gap-8 relative z-10">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 glass-panel rounded-3xl p-5 border border-white/10 h-fit space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Navigation</div>
          <div className="space-y-2">
            <button
              onClick={() => setActiveNav('teams')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeNav === 'teams'
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border-l-4 border-indigo-500'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              My Teams ({teams.length})
            </button>

            <button
              onClick={() => setActiveNav('friends')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeNav === 'friends'
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border-l-4 border-indigo-500'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Friends & Chat
            </button>

            <button
              onClick={() => setActiveNav('discover')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeNav === 'discover'
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border-l-4 border-indigo-500'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Discover Teams
            </button>
          </div>
        </div>

        {/* View Container */}
        <div className="flex-1">
          {/* 1. Teams View */}
          {activeNav === 'teams' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Your Joined Workspaces</h2>
                  <p className="text-sm text-gray-400">Access your active team chat rooms and channels.</p>
                </div>
                <button
                  onClick={() => setShowCreateTeam(!showCreateTeam)}
                  className="gradient-btn text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-transform hover:scale-102"
                >
                  + Create Team
                </button>
              </div>

              {/* Create Team Form Modal / Inline */}
              {showCreateTeam && (
                <div className="glass-panel rounded-3xl p-6 border border-indigo-500/20 shadow-xl">
                  <h3 className="text-lg font-bold mb-4 text-white">Create New Team</h3>
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1.5 text-xs uppercase tracking-wider">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                        placeholder="e.g. Design System Team"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1.5 text-xs uppercase tracking-wider">
                        Description (Optional)
                      </label>
                      <textarea
                        value={teamDesc}
                        onChange={(e) => setTeamDesc(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                        placeholder="Describe what your team focuses on..."
                        rows="3"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPrivateCheck"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded bg-white/5 border-white/10"
                      />
                      <label htmlFor="isPrivateCheck" className="text-sm font-semibold text-gray-300">
                        Make Team Private (Only invited members or approved join requests)
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="gradient-btn text-white px-6 py-2.5 rounded-xl font-bold text-sm"
                      >
                        {loading ? 'Creating...' : 'Create Team'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateTeam(false)}
                        className="bg-white/5 border border-white/10 text-gray-300 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Teams Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => navigate(`/chat/${team.id}`)}
                    className="glass-panel rounded-3xl p-6 border border-white/5 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-white tracking-tight">{team.name}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md ${
                          team.is_private ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-green-500/15 border border-green-500/30 text-green-300'
                        }`}>
                          {team.is_private ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                        {team.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                        Role: {team.role || 'Member'}
                      </span>
                      <button className="gradient-btn text-white px-4 py-1.5 rounded-xl text-xs font-bold">
                        Open Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {teams.length === 0 && !showCreateTeam && (
                <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 shadow-xl">
                  <p className="text-gray-400 text-lg mb-6">You aren't in any teams yet.</p>
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="gradient-btn text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                  >
                    Create Your First Team
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Friends & DMs View */}
          {activeNav === 'friends' && <FriendsView />}

          {/* 3. Discover Public Teams View */}
          {activeNav === 'discover' && <DiscoverTeamsView />}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
