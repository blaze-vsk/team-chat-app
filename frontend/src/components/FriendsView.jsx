import { useEffect, useState } from 'react';
import { useFriendStore } from '../store/friendStore';
import { useNavigate } from 'react-router-dom';

export default function FriendsView() {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const {
    friends,
    searchResults,
    incomingRequests,
    fetchFriends,
    fetchRequests,
    searchUsers,
    sendFriendRequest,
    respondToFriendRequest,
    startConversation
  } = useFriendStore();

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [fetchFriends, fetchRequests]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchUsers(searchQuery);
    }
  };

  const handleStartDM = async (friendId) => {
    const conv = await startConversation(friendId);
    if (conv) {
      navigate(`/chat/dm_${conv.id}`);
    }
  };

  const onRespondRequest = async (reqId, status) => {
    await respondToFriendRequest(reqId, status);
    fetchRequests();
    fetchFriends();
  };

  const onSendRequest = async (userId) => {
    await sendFriendRequest(userId);
    if (searchQuery.trim()) {
      searchUsers(searchQuery);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl min-h-[500px]">
      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-white/10 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('friends')}
          className={`font-bold text-sm pb-2 border-b-2 transition-all ${
            activeTab === 'friends'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          All Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`font-bold text-sm pb-2 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'requests'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Requests
          {incomingRequests.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
              {incomingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`font-bold text-sm pb-2 border-b-2 transition-all ${
            activeTab === 'search'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Find Users
        </button>
      </div>

      {/* 1. Friends List */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No friends added yet. Use the "Find Users" tab to search and add friends!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div key={friend.id} className="p-4 rounded-2xl glass-panel-light border border-white/5 flex justify-between items-center hover:border-indigo-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 gradient-btn text-white rounded-full flex items-center justify-center font-bold">
                        {friend.username[0].toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121624] ${
                        friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{friend.display_name || friend.username}</h4>
                      <p className="text-xs text-gray-400">@{friend.username}</p>
                      {friend.status_message && (
                        <p className="text-xs italic text-indigo-300 mt-1">"{friend.status_message}"</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartDM(friend.id)}
                    className="px-3.5 py-1.5 text-xs gradient-btn text-white rounded-xl font-bold"
                  >
                    Message
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Friend Requests */}
      {activeTab === 'requests' && (
        <div>
          {incomingRequests.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No pending friend requests.
            </div>
          ) : (
            <div className="space-y-3 max-w-xl">
              {incomingRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl glass-panel-light border border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      {req.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{req.username}</h4>
                      <p className="text-xs text-gray-400">{req.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onRespondRequest(req.id, 'accepted')}
                      className="px-4 py-2 text-xs bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRespondRequest(req.id, 'rejected')}
                      className="px-4 py-2 text-xs bg-white/5 border border-white/10 text-gray-300 rounded-xl font-bold hover:bg-white/10 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Find Users */}
      {activeTab === 'search' && (
        <div>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-6 max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or email..."
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="submit"
              className="px-6 py-2.5 gradient-btn text-white rounded-xl font-bold text-sm"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((usr) => (
              <div key={usr.id} className="p-4 rounded-2xl glass-panel-light border border-white/5 flex justify-between items-center hover:border-indigo-500/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    {usr.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{usr.username}</h4>
                    <p className="text-xs text-gray-400">{usr.email}</p>
                  </div>
                </div>

                {usr.is_friend ? (
                  <span className="text-[10px] text-green-300 font-bold uppercase tracking-wider px-2.5 py-1 bg-green-500/15 border border-green-500/30 rounded-md">
                    Friends
                  </span>
                ) : usr.has_pending_request ? (
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-md">
                    Pending
                  </span>
                ) : (
                  <button
                    onClick={() => onSendRequest(usr.id)}
                    className="px-3.5 py-1.5 text-xs gradient-btn text-white rounded-xl font-bold"
                  >
                    + Add Friend
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
