import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';
import { useChannelStore } from '../store/channelStore';
import { useMessageStore } from '../store/messageStore';
import TeamSettingsModal from '../components/TeamSettingsModal';
import NotificationBell from '../components/NotificationBell';

function ChatPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isDM = teamId?.startsWith('dm_');
  const conversationId = isDM ? teamId.replace('dm_', '') : null;

  const { currentTeam, fetchTeamDetails } = useTeamStore();
  const { channels, currentChannel, fetchChannels, setCurrentChannel } = useChannelStore();
  const {
    messages,
    initSocket,
    setActiveRoom,
    fetchChannelMessages,
    fetchDMMessages,
    sendMessage,
    uploadFile,
    editMessage,
    deleteMessage,
    toggleReaction,
    sendTyping,
    typingUsers
  } = useMessageStore();

  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    initSocket(token);

    const loadData = async () => {
      setLoading(true);
      if (isDM) {
        setActiveRoom({ type: 'dm', id: conversationId });
        await fetchDMMessages(conversationId);
      } else {
        await fetchTeamDetails(teamId);
        const fetchedChannels = await fetchChannels(teamId);
        if (fetchedChannels && fetchedChannels.length > 0) {
          const defaultChannel = fetchedChannels[0];
          setCurrentChannel(defaultChannel);
          setActiveRoom({ type: 'channel', id: defaultChannel.id, teamId });
          await fetchChannelMessages(defaultChannel.id);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [teamId, isDM, conversationId, fetchTeamDetails, fetchChannels, setCurrentChannel, setActiveRoom, fetchChannelMessages, fetchDMMessages, initSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChannelSelect = async (channel) => {
    setCurrentChannel(channel);
    setActiveRoom({ type: 'channel', id: channel.id, teamId });
    await fetchChannelMessages(channel.id);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedFile) return;

    let fileData = null;
    if (selectedFile) {
      setUploading(true);
      try {
        fileData = await uploadFile(selectedFile);
      } catch (err) {
        alert('File upload failed!');
        setUploading(false);
        return;
      }
      setUploading(false);
      setSelectedFile(null);
    }

    if (isDM) {
      sendMessage({ conversationId, content: messageInput, fileData });
    } else if (currentChannel) {
      sendMessage({ teamId, channelId: currentChannel.id, content: messageInput, fileData });
    }

    setMessageInput('');
    sendTyping(false);
  };

  const handleSaveEdit = async (messageId) => {
    if (editText.trim()) {
      await editMessage(messageId, editText);
      setEditingMessageId(null);
      setEditText('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  const typingUserNames = Object.keys(typingUsers);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* 1. Left Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800">
        {/* Workspace Title */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-blue-400 hover:underline block mb-1"
            >
              &larr; Back to Dashboard
            </button>
            <h2 className="font-bold text-lg text-white truncate">
              {isDM ? 'Direct Message' : currentTeam?.name}
            </h2>
          </div>

          {!isDM && currentTeam?.user_role === 'owner' && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Team Settings"
            >
              ⚙️
            </button>
          )}
        </div>

        {/* Channels & Members lists */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!isDM ? (
            <>
              {/* Channels List */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Channels
                  </span>
                  {currentTeam?.user_role === 'owner' && (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      +
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => handleChannelSelect(ch)}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium transition ${
                        currentChannel?.id === ch.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      # {ch.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Members List */}
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Members ({currentTeam?.members?.length || 0})
                </span>
                <div className="space-y-2">
                  {currentTeam?.members?.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        m.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <span className="truncate">{m.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">
              1-on-1 Direct Conversation
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="h-16 border-b px-6 flex justify-between items-center bg-white shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {isDM ? '💬 Direct Chat' : `# ${currentChannel?.name}`}
            </h1>
            <p className="text-xs text-gray-500">
              {isDM ? 'Private 1-on-1 message stream' : currentChannel?.description || 'Public channel'}
            </p>
          </div>

          <NotificationBell />
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">
              No messages here yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwner = msg.sender_id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 group ${isOwner ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {msg.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-lg rounded-2xl p-4 shadow-sm border ${
                    isOwner ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-200'
                  }`}>
                    {/* Top Row: Username & Time */}
                    <div className={`flex justify-between items-center gap-4 text-xs mb-1 ${
                      isOwner ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      <span className="font-bold">{msg.username}</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Content / Edit Mode */}
                    {editingMessageId === msg.id ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="px-2 py-1 text-sm text-gray-900 rounded border border-gray-300 w-full"
                        />
                        <button
                          onClick={() => handleSaveEdit(msg.id)}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {/* File Attachment Card */}
                    {msg.file_data && (
                      <div className="mt-3 p-3 bg-gray-900/10 rounded-lg border border-white/20">
                        {msg.file_data.mimeType?.startsWith('image/') ? (
                          <img
                            src={msg.file_data.fileUrl}
                            alt={msg.file_data.fileName}
                            className="max-h-60 rounded-lg object-cover"
                          />
                        ) : (
                          <a
                            href={msg.file_data.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-semibold underline"
                          >
                            📎 {msg.file_data.fileName} ({(msg.file_data.fileSize / 1024).toFixed(1)} KB)
                          </a>
                        )}
                      </div>
                    )}

                    {/* Reactions Row */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.reactions && Object.entries(msg.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border ${
                            userIds.includes(user?.id)
                              ? 'bg-blue-100 border-blue-400 text-blue-800 font-bold'
                              : 'bg-gray-100 border-gray-300 text-gray-700'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{userIds.length}</span>
                        </button>
                      ))}

                      {/* Quick Emoji Picker */}
                      <div className="opacity-0 group-hover:opacity-100 transition flex gap-1 items-center ml-2">
                        {['👍', '❤️', '😂', '🔥'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className="hover:scale-125 transition text-xs"
                          >
                            {emoji}
                          </button>
                        ))}

                        {isOwner && (
                          <>
                            <button
                              onClick={() => { setEditingMessageId(msg.id); setEditText(msg.content); }}
                              className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUserNames.length > 0 && (
          <div className="px-6 py-1 text-xs text-gray-500 italic bg-gray-50">
            {typingUserNames.join(', ')} {typingUserNames.length > 1 ? 'are' : 'is'} typing...
          </div>
        )}

        {/* Selected file preview pill */}
        {selectedFile && (
          <div className="px-6 py-2 bg-blue-50 border-t flex justify-between items-center text-xs text-blue-700">
            <span>Selected attachment: <strong>{selectedFile.name}</strong></span>
            <button onClick={() => setSelectedFile(null)} className="text-red-500 font-bold hover:underline">
              Remove
            </button>
          </div>
        )}

        {/* Message Input Box */}
        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              title="Attach File"
            >
              📎
            </button>

            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder={isDM ? 'Send direct message...' : `Message #${currentChannel?.name || 'channel'}`}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 text-sm shadow"
            >
              {uploading ? 'Uploading...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* Team Settings Modal */}
      {showSettings && currentTeam && (
        <TeamSettingsModal
          team={currentTeam}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default ChatPage;
