import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTeamStore } from '../store/teamStore'
import { useMessageStore } from '../store/messageStore'

function ChatPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentTeam, fetchTeamDetails } = useTeamStore()
  const { messages, socket, initSocket, sendMessage, fetchMessages, joinTeam } = useMessageStore()
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize WebSocket
    initSocket(localStorage.getItem('token'))
    
    // Fetch team details and messages
    const loadData = async () => {
      await fetchTeamDetails(teamId)
      await fetchMessages(teamId)
      joinTeam(teamId)
      setLoading(false)
    }
    
    loadData()
  }, [teamId, fetchTeamDetails, fetchMessages, joinTeam, initSocket])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (messageInput.trim()) {
      sendMessage(teamId, messageInput)
      setMessageInput('')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:text-blue-700 mb-4"
          >
            ← Back to Teams
          </button>
          <h2 className="text-xl font-bold text-gray-800">{currentTeam?.name}</h2>
          <p className="text-sm text-gray-500">Members: {currentTeam?.members?.length || 0}</p>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-bold text-gray-700 mb-3">Team Members</h3>
          {currentTeam?.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 mb-2"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                {member.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{member.username}</p>
                <p className={`text-xs ${member.status === 'online' ? 'text-green-600' : 'text-gray-400'}`}>
                  {member.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow p-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800">{currentTeam?.name}</h1>
          <p className="text-gray-500 text-sm">{currentTeam?.description}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender_id === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm font-bold">{msg.username}</p>
                  <p>{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
