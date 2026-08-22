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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header Navbar */}
      <div className="bg-white shadow border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow">
              TC
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Team Chat Platform</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="flex items-center gap-2 border-l pl-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <span className="text-gray-700 font-medium text-sm hidden md:inline">
                {user?.username}
              </span>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium hidden md:inline"
            >
              Settings
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-lg p-4 h-fit">
          <div className="space-y-1">
            <button
              onClick={() => setActiveNav('teams')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition ${
                activeNav === 'teams'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              My Teams ({teams.length})
            </button>

            <button
              onClick={() => setActiveNav('friends')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition ${
                activeNav === 'friends'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Friends & Direct Messages
            </button>

            <button
              onClick={() => setActiveNav('discover')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition ${
                activeNav === 'discover'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Discover Public Teams
            </button>
          </div>
        </div>

        {/* View Container */}
        <div className="flex-1">
          {/* 1. Teams View */}
          {activeNav === 'teams' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Your Joined Workspaces</h2>
                  <p className="text-sm text-gray-500">Access your active team chat rooms and channels.</p>
                </div>
                <button
                  onClick={() => setShowCreateTeam(!showCreateTeam)}
                  className="bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition shadow"
                >
                  + Create Team
                </button>
              </div>

              {/* Create Team Form Modal / Inline */}
              {showCreateTeam && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-blue-100">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">Create New Team</h3>
                  <form onSubmit={handleCreateTeam}>
                    <div className="mb-4">
                      <label className="block text-gray-700 font-semibold mb-1 text-sm">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="e.g. Design System Team"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 font-semibold mb-1 text-sm">
                        Description (Optional)
                      </label>
                      <textarea
                        value={teamDesc}
                        onChange={(e) => setTeamDesc(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Describe what your team focuses on..."
                        rows="3"
                      />
                    </div>

                    <div className="mb-6 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPrivateCheck"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor="isPrivateCheck" className="text-sm font-medium text-gray-700">
                        Make Team Private (Only invited members or approved join requests)
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 text-sm"
                      >
                        {loading ? 'Creating...' : 'Create Team'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateTeam(false)}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 text-sm"
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
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl cursor-pointer transition border border-gray-100 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{team.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          team.is_private ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {team.is_private ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {team.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">
                        Role: {team.role || 'Member'}
                      </span>
                      <button className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600">
                        Open Chat &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {teams.length === 0 && !showCreateTeam && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <p className="text-gray-500 text-lg mb-4">You aren't in any teams yet.</p>
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-600 shadow"
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
