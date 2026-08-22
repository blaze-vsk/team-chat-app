import { useState, useEffect } from 'react';
import { useTeamStore } from '../store/teamStore';
import { useChannelStore } from '../store/channelStore';

export default function TeamSettingsModal({ team, onClose }) {
  const [name, setName] = useState(team.name || '');
  const [description, setDescription] = useState(team.description || '');
  const [isPrivate, setIsPrivate] = useState(team.is_private || false);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'members' | 'channels' | 'invite'
  const [newChannelName, setNewChannelName] = useState('');
  const [friendsToInvite, setFriendsToInvite] = useState([]);

  const { updateTeamSettings, removeMember, sendInvitation, getFriendsToInvite, fetchTeamDetails } = useTeamStore();
  const { channels, fetchChannels, createChannel, deleteChannel } = useChannelStore();

  useEffect(() => {
    fetchChannels(team.id);
    getFriendsToInvite(team.id).then(setFriendsToInvite);
  }, [team.id, fetchChannels, getFriendsToInvite]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await updateTeamSettings(team.id, { name, description, isPrivate });
    await fetchTeamDetails(team.id);
    alert('Team settings updated!');
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (newChannelName.trim()) {
      await createChannel(team.id, newChannelName);
      setNewChannelName('');
      fetchChannels(team.id);
    }
  };

  const handleKickMember = async (memberId) => {
    if (confirm('Are you sure you want to remove this member from the team?')) {
      await removeMember(team.id, memberId);
      await fetchTeamDetails(team.id);
    }
  };

  const handleInviteFriend = async (friendId) => {
    await sendInvitation(team.id, friendId);
    alert('Invitation sent!');
    getFriendsToInvite(team.id).then(setFriendsToInvite);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-5 bg-white/3 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-extrabold text-white text-base tracking-tight">Team Settings: {team.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl font-light">
            &times;
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-white/5 bg-[#0f1422] px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'settings' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'channels' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Channels ({channels.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'members' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Members ({team.members?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'invite' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Invite
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#0b0f19]/30">
          {/* 1. General Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div>
                <label className="block text-gray-300 font-semibold mb-2 text-xs uppercase tracking-wider">Team Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2 text-xs uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded bg-white/5 border-white/10"
                />
                <label htmlFor="isPrivate" className="text-sm font-semibold text-gray-300">
                  Private Team (Requires owner approval to join)
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="gradient-btn text-white px-6 py-2.5 rounded-xl font-bold text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* 2. Channels */}
          {activeTab === 'channels' && (
            <div>
              <form onSubmit={handleCreateChannel} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. project-discussion"
                  className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 gradient-btn text-white rounded-xl font-bold text-sm"
                >
                  + Add Channel
                </button>
              </form>

              <div className="space-y-2.5">
                {channels.map((ch) => (
                  <div key={ch.id} className="flex justify-between items-center p-4 rounded-2xl glass-panel-light border border-white/5">
                    <div>
                      <span className="font-bold text-white text-sm">#{ch.name}</span>
                      {ch.description && <p className="text-xs text-gray-400 mt-0.5">{ch.description}</p>}
                    </div>

                    {ch.name !== 'general' && (
                      <button
                        onClick={() => deleteChannel(team.id, ch.id)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Members */}
          {activeTab === 'members' && (
            <div className="space-y-2.5">
              {team.members?.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-4 rounded-2xl glass-panel-light border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 gradient-btn text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {m.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        {m.username}
                        {m.role === 'owner' && (
                          <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-md">
                            Owner
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                  </div>

                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleKickMember(m.id)}
                      className="px-3.5 py-1.5 text-xs bg-red-500/15 border border-red-500/30 text-red-200 rounded-xl font-bold hover:bg-red-500/25 transition"
                    >
                      Kick Member
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 4. Invite Friends */}
          {activeTab === 'invite' && (
            <div>
              {friendsToInvite.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  All your friends are already in this team, or you haven't added any friends yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {friendsToInvite.map((f) => (
                    <div key={f.id} className="flex justify-between items-center p-4 rounded-2xl glass-panel-light border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {f.username[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{f.username}</h4>
                          <p className="text-xs text-gray-400">{f.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInviteFriend(f.id)}
                        className="px-3.5 py-1.5 text-xs gradient-btn text-white rounded-xl font-bold"
                      >
                        Send Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
