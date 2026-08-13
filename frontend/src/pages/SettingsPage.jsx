import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [username, setUsername] = useState(user?.username || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    // TODO: Implement profile update API call
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
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:text-blue-700"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Settings Container */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Profile Settings</h2>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition mb-4"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <hr className="my-6" />

          <h2 className="text-2xl font-bold mb-6 text-gray-800">Danger Zone</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
