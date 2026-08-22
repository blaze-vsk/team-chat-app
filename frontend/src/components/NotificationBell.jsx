import { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useFriendStore } from '../store/friendStore';
import { useTeamStore } from '../store/teamStore';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } = useNotificationStore();
  const { respondToFriendRequest } = useFriendStore();
  const { respondToInvitation } = useTeamStore();

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
        className="relative p-2.5 text-gray-300 hover:text-white focus:outline-none rounded-xl hover:bg-white/5 transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-black text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden">
          <div className="p-3.5 bg-white/3 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-5 text-center text-gray-400 text-xs">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 text-xs hover:bg-white/5 transition-all ${!n.is_read ? 'bg-indigo-500/10' : ''}`}>
                  <p className="text-gray-200 leading-relaxed">{n.content}</p>
                  <p className="text-[10px] text-gray-500 mt-1.5 font-semibold">
                    {new Date(n.created_at).toLocaleString()}
                  </p>

                  {/* Actions for friend requests or invitations */}
                  {n.type === 'friend_request' && n.metadata?.requestId && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleFriendResponse(n.metadata.requestId, 'accepted')}
                        className="px-3.5 py-1.5 text-[10px] bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleFriendResponse(n.metadata.requestId, 'rejected')}
                        className="px-3.5 py-1.5 text-[10px] bg-white/5 text-gray-300 rounded-xl font-bold hover:bg-white/10 transition border border-white/5"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {n.type === 'team_invitation' && n.metadata?.invitationId && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleInviteResponse(n.metadata.invitationId, 'accepted')}
                        className="px-3.5 py-1.5 text-[10px] bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
                      >
                        Accept Invite
                      </button>
                      <button
                        onClick={() => handleInviteResponse(n.metadata.invitationId, 'rejected')}
                        className="px-3.5 py-1.5 text-[10px] bg-white/5 text-gray-300 rounded-xl font-bold hover:bg-white/10 transition border border-white/5"
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
