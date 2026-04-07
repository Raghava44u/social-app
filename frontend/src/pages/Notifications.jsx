import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, senderId) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      if (senderId) {
        navigate(`/profile/${senderId}`);
      }
    } catch (err) {
      console.error('Error marking as read', err);
      if (senderId) {
        navigate(`/profile/${senderId}`);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  if (loading) return <Spinner />;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn-text" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="no-data">You have no notifications.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => handleMarkAsRead(notif.id, notif.sender?.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="notification-content">
                <div className="notif-avatar">
                   {notif.sender?.profileImage ? (
                     <img src={notif.sender.profileImage} alt="avatar" />
                   ) : (
                     <div className="avatar-placeholder-small">{notif.sender?.username?.[0] || '?'}</div>
                   )}
                </div>
                <div className="notif-details">
                  <p>{notif.message}</p>
                  <span className="notif-time">{new Date(notif.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {!notif.isRead && (
                <button 
                  className="btn-mark-read" 
                  onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                  title="Mark as read"
                ></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
