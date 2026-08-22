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
      // Send join request auto-approved or join directly
      await sendJoinRequest(team.id);
      navigate(`/chat/${team.id}`);
    } else {
      await sendJoinRequest(team.id);
      alert('Join request sent to team owner!');
      fetchPublicTeams(search);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 min-h-[500px]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Discover Public & Community Teams</h2>
        <p className="text-gray-500 text-sm">Find and join open teams or request access to private groups.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams by name..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Search
        </button>
      </form>

      {publicTeams.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No public teams found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicTeams.map((team) => (
            <div key={team.id} className="p-6 border rounded-lg hover:shadow-lg transition flex flex-col justify-between bg-gray-50">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800">{team.name}</h3>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    team.is_private ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {team.is_private ? 'Private' : 'Public'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{team.description || 'No description provided.'}</p>
                <div className="text-xs text-gray-500 mb-4">
                  Members: {team.member_count || 1}
                </div>
              </div>

              {team.is_member ? (
                <button
                  onClick={() => navigate(`/chat/${team.id}`)}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                >
                  Open Team Chat
                </button>
              ) : team.has_requested ? (
                <button
                  disabled
                  className="w-full py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed"
                >
                  Request Pending
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(team)}
                  className="w-full py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
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
