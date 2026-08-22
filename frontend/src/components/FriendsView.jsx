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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 min-h-[500px]">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b pb-4 mb-6">
        <button
          onClick={() => setActiveTab('friends')}
          className={`font-semibold pb-2 border-b-2 ${
            activeTab === 'friends'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`font-semibold pb-2 border-b-2 flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Requests
          {incomingRequests.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {incomingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`font-semibold pb-2 border-b-2 ${
            activeTab === 'search'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Find Users
        </button>
      </div>

      {/* 1. Friends List */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No friends added yet. Use the "Find Users" tab to search and add friends!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div key={friend.id} className="p-4 border rounded-lg hover:shadow-md flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {friend.username[0].toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{friend.display_name || friend.username}</h4>
                      <p className="text-xs text-gray-500">@{friend.username}</p>
                      {friend.status_message && (
                        <p className="text-xs italic text-gray-600 mt-1">"{friend.status_message}"</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartDM(friend.id)}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Direct Message
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
            <div className="text-center py-12 text-gray-500">
              No pending friend requests.
            </div>
          ) : (
            <div className="space-y-3 max-w-xl">
              {incomingRequests.map((req) => (
                <div key={req.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                      {req.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{req.username}</h4>
                      <p className="text-xs text-gray-500">{req.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToFriendRequest(req.id, 'accepted')}
                      className="px-4 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToFriendRequest(req.id, 'rejected')}
                      className="px-4 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
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
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((user) => (
              <div key={user.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{user.username}</h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                {user.is_friend ? (
                  <span className="text-xs text-green-600 font-semibold px-2 py-1 bg-green-100 rounded">
                    Friends
                  </span>
                ) : user.has_pending_request ? (
                  <span className="text-xs text-amber-600 font-semibold px-2 py-1 bg-amber-100 rounded">
                    Pending
                  </span>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(user.id)}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
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
