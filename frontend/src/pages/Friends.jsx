import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setSearchResults(res.data.data.users);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await api.post(`/friends/request/${userId}`);
      // Update local state to show request sent
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, requestSent: true } : u));
    } catch (err) {
      console.error("Error sending friend request", err);
    }
  };

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

      <div className="friends-section" style={{ marginBottom: '2rem' }}>
        <h2>Search Users</h2>
        <div className="ig-search-container" style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={handleSearch}
            className="ig-search-input"
            style={{
              width: '100%',
              padding: '12px 1rem',
              borderRadius: '8px',
              border: '1px solid #dbdbdb',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          {searching && <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.85rem' }}>Searching...</div>}
        </div>

        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <div className="users-grid" style={{ marginBottom: '3rem', background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #dbdbdb' }}>
            {searchResults.map(returnedUser => (
              <div key={returnedUser.id} className="user-card" style={{ border: 'none', background: '#fafafa' }}>
                <Link to={`/profile/${returnedUser.id}`} className="user-card-header">
                  {returnedUser.profileImage ? (
                     <img src={returnedUser.profileImage} alt="avatar" />
                  ) : (
                     <div className="avatar-placeholder">{returnedUser.username[0]}</div>
                  )}
                  <div>
                    <h4>{returnedUser.firstName} {returnedUser.lastName}</h4>
                    <p>@{returnedUser.username}</p>
                  </div>
                </Link>
                <div className="user-card-actions">
                  {returnedUser.requestSent ? (
                    <button className="btn-secondary" disabled>Request Sent</button>
                  ) : (
                    <button className="btn-primary" onClick={() => handleSendRequest(returnedUser.id)}>Add Friend</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <p style={{ color: '#666' }}>No users found matching "{searchQuery}"</p>
        )}
      </div>
      
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
