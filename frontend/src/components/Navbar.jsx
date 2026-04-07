import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Home, Search, PlusSquare, Heart, User, LogOut } from 'lucide-react';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const res = await api.get('/notifications/unread-count');
          setUnreadCount(res.data.data.unreadCount);
        } catch (err) {}
      };

      fetchUnreadCount();

      let interval;
      if (!socket || !socket.connected) {
        interval = setInterval(fetchUnreadCount, 30000);
      }

      if (socket) {
        socket.on('new_notification', (notification) => {
          if (!notification.isRead) {
            setUnreadCount(prev => prev + 1);
          }
        });
      }

      return () => {
        if (interval) clearInterval(interval);
        if (socket) socket.off('new_notification');
      };
    }
  }, [user, socket]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="ig-navbar-top">
        <Link to="/" className="ig-logo">SocialGram</Link>
        <div className="ig-nav-icons">
          <Link to="/notifications" style={{position: 'relative'}}>
            <Heart size={24} color="#000" strokeWidth={1.5} />
            {unreadCount > 0 && <span className="artbook-badge badge">{unreadCount}</span>}
          </Link>
          <button onClick={handleLogout} title="Logout"><LogOut size={22} color="#000" strokeWidth={1.5} /></button>
        </div>
      </nav>

      {/* Bottom Nav for Mobile */}
      <nav className="ig-bottom-nav">
        <Link to="/"><Home size={24} color="#000" strokeWidth={1.5} /></Link>
        <Link to="/friends"><Search size={24} color="#000" strokeWidth={1.5} /></Link>
        <Link to="/"><PlusSquare size={24} color="#000" strokeWidth={1.5} /></Link>
        <Link to="/profile/me"><User size={24} color="#000" strokeWidth={1.5} /></Link>
      </nav>
    </>
  );
};

export default Navbar;
