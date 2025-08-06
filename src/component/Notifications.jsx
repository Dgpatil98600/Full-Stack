import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/notifications/list');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    }
    setLoading(false);
  };

  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification');
    }
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'reorder':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'expiry':
        return 'bg-red-50 border-l-4 border-red-500';
      default:
        return 'bg-white';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reorder':
        return '🔄';
      case 'expiry':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' || notif.type === filter
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('reorder')}
              className={`px-4 py-2 rounded ${filter === 'reorder' ? 'bg-yellow-500 text-white' : 'bg-white'}`}
            >
              Reorder
            </button>
            <button
              onClick={() => setFilter('expiry')}
              className={`px-4 py-2 rounded ${filter === 'expiry' ? 'bg-red-500 text-white' : 'bg-white'}`}
            >
              Expiry
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notifications found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`p-4 rounded-lg shadow flex items-center justify-between ${getNotificationStyle(notif.type)}`}
              >
                <div className="flex items-start space-x-4">
                  <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="font-semibold text-lg">{notif.productName}</div>
                      <span className="text-sm px-2 py-1 rounded-full bg-gray-200">
                        {notif.type === 'reorder' ? 'Reorder Alert' : 'Expiry Alert'}
                      </span>
                    </div>
                    <div className="text-gray-700 mt-1">{notif.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                  onClick={() => deleteNotification(notif._id)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 