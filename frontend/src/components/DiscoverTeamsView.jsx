import { useEffect, useState } from 'react';
import { useTeamStore } from '../store/teamStore';
import { useNavigate } from 'react-router-dom';

export default function DiscoverTeamsView() {
  const [search, setSearch] = useState('');
  const { publicTeams, fetchPublicTeams, sendJoinRequest } = useTeamStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicTeams();
  }, [fetchPublicTeams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPublicTeams(search);
  };

  const handleJoin = async (team) => {
    if (!team.is_private) {
      await sendJoinRequest(team.id);
      navigate(`/chat/${team.id}`);
    } else {
      await sendJoinRequest(team.id);
      alert('Join request sent to team owner!');
      fetchPublicTeams(search);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl min-h-[500px]">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Discover Teams</h2>
        <p className="text-gray-400 text-sm">Find and join open teams or request access to private groups.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams by name..."
          className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button
          type="submit"
          className="px-6 py-2.5 gradient-btn text-white rounded-xl font-bold text-sm"
        >
          Search
        </button>
      </form>

      {publicTeams.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No public teams found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicTeams.map((team) => (
            <div key={team.id} className="p-6 rounded-3xl glass-panel-light border border-white/5 flex flex-col justify-between hover:border-indigo-500/10 transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white tracking-tight">{team.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md ${
                    team.is_private ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-green-500/15 border border-green-500/30 text-green-300'
                  }`}>
                    {team.is_private ? 'Private' : 'Public'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{team.description || 'No description provided.'}</p>
                <div className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">
                  Members: {team.member_count || 1}
                </div>
              </div>

              {team.is_member ? (
                <button
                  onClick={() => navigate(`/chat/${team.id}`)}
                  className="w-full py-2.5 gradient-btn text-white rounded-xl font-bold text-sm"
                >
                  Open Chat
                </button>
              ) : team.has_requested ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed"
                >
                  Request Pending
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(team)}
                  className="w-full py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition"
                >
                  {team.is_private ? 'Request Access' : 'Join Team'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
