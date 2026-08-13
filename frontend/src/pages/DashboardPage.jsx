import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTeamStore } from '../store/teamStore'

function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { teams, fetchTeams, createTeam } = useTeamStore()
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDesc, setTeamDesc] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    setLoading(true)
    await createTeam(teamName, teamDesc)
    setTeamName('')
    setTeamDesc('')
    setShowCreateTeam(false)
    await fetchTeams()
    setLoading(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Team Chat App</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Your Teams</h2>
          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            + Create Team
          </button>
        </div>

        {/* Create Team Form */}
        {showCreateTeam && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Engineering"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team description..."
                  rows="3"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
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
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl cursor-pointer transition"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">{team.name}</h3>
              <p className="text-gray-600 mb-4">{team.description || 'No description'}</p>
              <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Open Chat
              </button>
            </div>
          ))}
        </div>

        {teams.length === 0 && !showCreateTeam && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No teams yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
