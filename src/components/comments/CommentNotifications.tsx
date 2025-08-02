import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CommentService } from '@/services/CommentService';
import { CommentNotification } from '@/types/comments';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiHeart, FiAtSign, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface CommentNotificationsProps {
  onNotificationClick?: (notification: CommentNotification) => void;
}

export const CommentNotifications: React.FC<CommentNotificationsProps> = ({ onNotificationClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CommentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const unreadNotifications = await CommentService.getUnreadNotifications(user!.id);
      setNotifications(unreadNotifications);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: CommentNotification) => {
    try {
      await CommentService.markNotificationsAsRead([notification.id]);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      onNotificationClick?.(notification);
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const getNotificationIcon = (type: CommentNotification['type']) => {
    switch (type) {
      case 'reply':
        return <FiMessageSquare className="text-blue-500" />;
      case 'reaction':
        return <FiHeart className="text-red-500" />;
      case 'mention':
        return <FiAtSign className="text-green-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: CommentNotification) => {
    switch (notification.type) {
      case 'reply':
        return `${notification.fromUserName} replied to your comment`;
      case 'reaction':
        return `${notification.fromUserName} reacted to your comment`;
      case 'mention':
        return `${notification.fromUserName} mentioned you in a comment`;
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
      >
        <FiMessageSquare size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
              <h3 className="font-semibold">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No new notifications
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 