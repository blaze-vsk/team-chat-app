import { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useFriendStore } from '../store/friendStore';
import { useTeamStore } from '../store/teamStore';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();
  const { respondToFriendRequest } = useFriendStore();
  const { respondToInvitation, respondToJoinRequest } = useTeamStore();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleFriendResponse = async (requestId, status) => {
    await respondToFriendRequest(requestId, status);
    fetchNotifications();
  };

  const handleInviteResponse = async (invitationId, status) => {
    await respondToInvitation(invitationId, status);
    fetchNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none rounded-full hover:bg-gray-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-xs text-blue-500 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 text-sm hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                  <p className="text-gray-800">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>

                  {/* Actions for friend requests or invitations */}
                  {n.type === 'friend_request' && n.metadata?.requestId && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleFriendResponse(n.metadata.requestId, 'accepted')}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleFriendResponse(n.metadata.requestId, 'rejected')}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {n.type === 'team_invitation' && n.metadata?.invitationId && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleInviteResponse(n.metadata.invitationId, 'accepted')}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Accept Invite
                      </button>
                      <button
                        onClick={() => handleInviteResponse(n.metadata.invitationId, 'rejected')}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
