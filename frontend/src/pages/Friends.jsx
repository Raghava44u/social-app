import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, []);

  const fetchFriendsAndRequests = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests')
      ]);
      setFriends(friendsRes.data.data.friends);
      setRequests(requestsRes.data.data.requests);
    } catch (err) {
      setError('Failed to fetch friends data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.put(`/friends/accept/${requestId}`);
      fetchFriendsAndRequests();
    } catch (err) {
      console.error("Error accepting request", err);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.put(`/friends/reject/${requestId}`);
      fetchFriendsAndRequests();
    } catch (err) {
      console.error("Error rejecting request", err);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await api.delete(`/friends/${friendId}`);
      fetchFriendsAndRequests();
    } catch (err) {
      console.error("Error removing friend", err);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="friends-page">
      {error && <div className="error-msg">{error}</div>}
      
      <div className="friends-section">
        <h2>Friend Requests ({requests.length})</h2>
        {requests.length === 0 ? (
          <p>No pending friend requests.</p>
        ) : (
          <div className="users-grid">
            {requests.map(req => (
              <div key={req.id} className="user-card">
                <Link to={`/profile/${req.sender.id}`} className="user-card-header">
                  {req.sender.profileImage ? (
                     <img src={req.sender.profileImage} alt="avatar" />
                  ) : (
                     <div className="avatar-placeholder">{req.sender.username[0]}</div>
                  )}
                  <div>
                    <h4>{req.sender.firstName} {req.sender.lastName}</h4>
                    <p>@{req.sender.username}</p>
                  </div>
                </Link>
                <div className="user-card-actions">
                  <button className="btn-primary" onClick={() => handleAccept(req.id)}>Accept</button>
                  <button className="btn-secondary" onClick={() => handleReject(req.id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="friends-section" style={{ marginTop: '3rem' }}>
        <h2>My Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p>You haven't added any friends yet.</p>
        ) : (
          <div className="users-grid">
            {friends.map(friend => (
              <div key={friend.id} className="user-card">
                <Link to={`/profile/${friend.id}`} className="user-card-header">
                  {friend.profileImage ? (
                     <img src={friend.profileImage} alt="avatar" />
                  ) : (
                     <div className="avatar-placeholder">{friend.username[0]}</div>
                  )}
                  <div>
                    <h4>{friend.firstName} {friend.lastName}</h4>
                    <p>@{friend.username}</p>
                  </div>
                </Link>
                <div className="user-card-actions">
                  <button className="btn-danger" onClick={() => handleRemoveFriend(friend.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
