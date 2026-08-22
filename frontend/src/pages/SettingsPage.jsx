import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [statusMessage, setStatusMessage] = useState(user?.status_message || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await updateProfile({
      displayName,
      statusMessage
    });

    setLoading(false);
    if (res.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to update profile' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header Navbar */}
      <div className="bg-white shadow border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Account Settings</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 pb-2 border-b">Public Profile</h2>

          {message && (
            <div className={`p-4 mb-6 rounded-lg text-sm font-semibold ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Your email address cannot be changed.</p>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">Username</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">Status Message</label>
              <input
                type="text"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="e.g. Working remotely today 🚀"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition shadow text-sm"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Settings'}
            </button>
          </form>

          <hr className="my-8" />

          <h2 className="text-xl font-bold mb-4 text-gray-800">Account Session</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-red-600 transition text-sm shadow"
          >
            Logout Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
