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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg">Team Settings: {team.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-xl">
            &times;
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b bg-gray-100 px-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 ${
              activeTab === 'settings' ? 'border-blue-500 text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 ${
              activeTab === 'channels' ? 'border-blue-500 text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Channels ({channels.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 ${
              activeTab === 'members' ? 'border-blue-500 text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Members ({team.members?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 ${
              activeTab === 'invite' ? 'border-blue-500 text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Invite Friends
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 1. General Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-gray-800">
                  Private Team (Requires owner approval to join)
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
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
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold text-sm"
                >
                  + Add Channel
                </button>
              </form>

              <div className="space-y-2">
                {channels.map((ch) => (
                  <div key={ch.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                    <div>
                      <span className="font-semibold text-gray-800">#{ch.name}</span>
                      {ch.description && <p className="text-xs text-gray-500">{ch.description}</p>}
                    </div>

                    {ch.name !== 'general' && (
                      <button
                        onClick={() => deleteChannel(team.id, ch.id)}
                        className="text-xs text-red-500 hover:text-red-700"
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
            <div className="space-y-3">
              {team.members?.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {m.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {m.username}
                        {m.role === 'owner' && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                            Owner
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                  </div>

                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleKickMember(m.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
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
                <div className="text-center py-8 text-gray-500 text-sm">
                  All your friends are already in this team, or you haven't added any friends yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {friendsToInvite.map((f) => (
                    <div key={f.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {f.username[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm">{f.username}</h4>
                          <p className="text-xs text-gray-500">{f.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInviteFriend(f.id)}
                        className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
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
