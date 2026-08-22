import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/25 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl relative">
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>

        <h1 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
          Team Chat App
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8 font-medium">Welcome back! Log in to join the conversation.</p>
        
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-bounce">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="yourname@domain.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-btn text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 text-sm tracking-wide mt-2"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Don't have an account? 
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1.5 transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
