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
      <div className="flex items-center justify-center h-screen bg-[#0b0f19]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const typingUserNames = Object.keys(typingUsers);

  return (
    <div className="flex h-screen overflow-hidden text-gray-100">
      {/* 1. Left Sidebar */}
      <div className="w-64 glass-panel flex flex-col border-r border-white/5 bg-gray-950/70 backdrop-blur-lg">
        {/* Workspace Title */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/3">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold block mb-1"
            >
              &larr; Back to Hub
            </button>
            <h2 className="font-extrabold text-white truncate text-base tracking-tight">
              {isDM ? 'Direct Message' : currentTeam?.name}
            </h2>
          </div>

          {!isDM && currentTeam?.user_role === 'owner' && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
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
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Channels
                  </span>
                  {currentTeam?.user_role === 'owner' && (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      + Add
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => handleChannelSelect(ch)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        currentChannel?.id === ch.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      # {ch.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Members List */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3 px-1">
                  Members ({currentTeam?.members?.length || 0})
                </span>
                <div className="space-y-2.5">
                  {currentTeam?.members?.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5 text-sm text-gray-300 px-1">
                      <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-gray-950 ${
                        m.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <span className="truncate font-semibold">{m.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
              💬 1-on-1 DM Session
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0b0f19]/30">
        {/* Header */}
        <div className="h-16 border-b border-white/5 px-6 flex justify-between items-center bg-gray-950/20 backdrop-blur">
          <div>
            <h1 className="text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
              {isDM ? '💬 Direct Chat' : `# ${currentChannel?.name}`}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              {isDM ? 'Private 1-on-1 message stream' : currentChannel?.description || 'Public channel'}
            </p>
          </div>

          <NotificationBell />
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0b0f19]/10">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-sm font-medium">
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
                  <div className="w-10 h-10 gradient-btn text-white rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 shadow-lg">
                    {msg.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-lg rounded-2xl p-4 shadow-xl relative border ${
                    isOwner 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-500/30' 
                      : 'glass-panel text-gray-100 border-white/5'
                  }`}>
                    {/* Top Row: Username & Time */}
                    <div className={`flex justify-between items-center gap-6 text-xs mb-1.5 font-bold ${
                      isOwner ? 'text-indigo-200' : 'text-gray-400'
                    }`}>
                      <span>{msg.username}</span>
                      <span className="font-medium opacity-80">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Content / Edit Mode */}
                    {editingMessageId === msg.id ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="px-3 py-1.5 text-sm text-white bg-black/30 rounded-xl border border-white/10 w-full outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleSaveEdit(msg.id)}
                          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                    )}

                    {/* File Attachment Card */}
                    {(() => {
                      const file = msg.file_data || (msg.file_url ? {
                        fileUrl: msg.file_url,
                        fileName: msg.file_name,
                        fileSize: msg.file_size,
                        mimeType: msg.file_type
                      } : null);

                      if (!file) return null;

                      return (
                        <div className="mt-3 p-3 bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                          {file.mimeType?.startsWith('image/') || (typeof file.fileName === 'string' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.fileName)) ? (
                            <img
                              src={file.fileUrl}
                              alt={file.fileName}
                              className="max-h-60 rounded-lg object-cover w-full hover:scale-101 transition-transform"
                            />
                          ) : (
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs font-bold text-indigo-300 hover:text-indigo-200 underline"
                            >
                              📎 {file.fileName} ({(file.fileSize / 1024).toFixed(1)} KB)
                            </a>
                          )}
                        </div>
                      );
                    })()}

                    {/* Reactions Row */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {msg.reactions && Object.entries(msg.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={`px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all ${
                            userIds.includes(user?.id)
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{userIds.length}</span>
                        </button>
                      ))}

                      {/* Quick Emoji Picker */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 items-center ml-2">
                        {['👍', '❤️', '😂', '🔥'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className="hover:scale-130 transition text-xs p-0.5"
                          >
                            {emoji}
                          </button>
                        ))}

                        {isOwner && (
                          <div className="flex gap-2 ml-3 border-l border-white/10 pl-3">
                            <button
                              onClick={() => { setEditingMessageId(msg.id); setEditText(msg.content); }}
                              className="text-[10px] font-bold text-indigo-400 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="text-[10px] font-bold text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
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
          <div className="px-6 py-1 text-xs text-indigo-300 italic bg-black/15">
            {typingUserNames.join(', ')} {typingUserNames.length > 1 ? 'are' : 'is'} typing...
          </div>
        )}

        {/* Selected file preview pill */}
        {selectedFile && (
          <div className="px-6 py-2 bg-indigo-950/40 border-t border-white/5 flex justify-between items-center text-xs text-indigo-300">
            <span>Attachment to upload: <strong>{selectedFile.name}</strong></span>
            <button onClick={() => setSelectedFile(null)} className="text-red-400 font-bold hover:underline">
              Remove
            </button>
          </div>
        )}

        {/* Message Input Box */}
        <div className="p-4 border-t border-white/5 bg-gray-950/30 backdrop-blur-md">
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
              className="p-3 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
              title="Attach File"
            >
              📎
            </button>

            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder={isDM ? 'Send direct message...' : `Message #${currentChannel?.name || 'channel'}`}
              className="flex-1 px-4 py-3 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            />

            <button
              type="submit"
              disabled={uploading}
              className="gradient-btn text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 text-sm shadow-lg"
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
