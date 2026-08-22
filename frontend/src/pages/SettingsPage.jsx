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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Top Header Navbar */}
      <div className="glass-panel border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-extrabold text-white tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-2xl mx-auto px-6 py-8 w-full relative z-10">
        <div className="glass-panel rounded-3xl p-8 border border-white/5 shadow-2xl">
          <h2 className="text-lg font-bold mb-6 text-white pb-3 border-b border-white/5">Public Profile</h2>

          {message && (
            <div className={`p-4 mb-6 rounded-xl text-sm font-bold ${
              message.type === 'success' ? 'bg-green-500/15 border border-green-500/30 text-green-300' : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}>
              {message.type === 'success' ? '✓ ' : '⚠️ '} {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-gray-300 font-semibold mb-2 text-xs uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-white/3 border border-white/5 rounded-xl text-gray-400 text-sm cursor-not-allowed outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">Your registered email address cannot be changed.</p>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2 text-xs uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-4 py-3 bg-white/3 border border-white/5 rounded-xl text-gray-400 text-sm cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2 text-xs uppercase tracking-wider">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2 text-xs uppercase tracking-wider">Status Message</label>
              <input
                type="text"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="e.g. Working remotely today 🚀"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-btn text-white font-bold py-3 px-4 rounded-xl transition shadow-lg text-sm tracking-wide"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Settings'}
            </button>
          </form>

          <hr className="my-8 border-white/5" />

          <h2 className="text-lg font-bold mb-4 text-white">Account Session</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/15 border border-red-500/30 text-red-200 font-bold py-3 px-4 rounded-xl hover:bg-red-500/25 transition text-sm shadow"
          >
            Logout Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
