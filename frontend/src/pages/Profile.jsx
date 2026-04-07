import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Post from '../components/Post';
import Spinner from '../components/Spinner';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const targetId = id === 'me' ? currentUser.id : id;
      const res = await api.get(`/users/${targetId}`);
      setProfileData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const targetId = id === 'me' ? currentUser.id : id;
      const res = await api.get(`/posts/user/${targetId}`);
      setPosts(res.data.data.posts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendRequest = async () => {
    try {
      await api.post(`/friends/request/${profileData.user.id}`);
      fetchProfile();
    } catch(err) {
      console.error("Error sending request", err);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      // Find the pending request from this user to current user
      const res = await api.get('/friends/requests');
      const pendingReq = res.data.data.requests.find(r => r.sender.id === profileData.user.id);
      if (pendingReq) {
        await api.put(`/friends/accept/${pendingReq.id}`);
        fetchProfile();
      }
    } catch(err) {
      console.error("Error accepting request", err);
    }
  };

  if (!profileData) return <Spinner />;

  const isOwnProfile = id === 'me' || currentUser.id === profileData.user.id;

  const handleEditProfile = async () => {
    const newBio = window.prompt("Enter your new bio:", profileData.user.bio || "");
    if (newBio !== null && newBio !== profileData.user.bio) {
      try {
        await api.put('/users/profile', { bio: newBio });
        fetchProfile();
      } catch(err) {
        console.error("Failed to update profile", err);
      }
    }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      await api.put('/users/profile/image', formData);
      fetchProfile();
    } catch (err) {
      console.error("Failed to upload avatar", err);
      alert("Failed to upload image. Please try again.");
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Profile URL copied to clipboard!");
  };

  // Real data formatting
  const friendsCount = profileData.friendsCount || 0;
  const postsCount = posts.length || 0;

  return (
    <div className="ig-profile-container">
      <div className="ig-profile-header">
        <div className="ig-avatar-wrapper">
          <div className="ig-avatar" onClick={() => isOwnProfile && fileInputRef.current?.click()} style={{cursor: isOwnProfile ? 'pointer' : 'default'}}>
            {profileData.user.profileImage ? 
              <img src={profileData.user.profileImage} alt="profile" /> :
              <div className="placeholder">{profileData.user.username[0]}</div>
            }
          </div>
        </div>
        <div className="ig-profile-stats-container">
          <h2 className="ig-username">{profileData.user.username.toLowerCase()}</h2>
          <div className="ig-stats-row">
            <div className="ig-stat">
              <span>{postsCount}</span>
              <label>posts</label>
            </div>
            <div className="ig-stat">
              <span>{friendsCount}</span>
              <label>friends</label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="ig-bio-section">
        <div className="ig-bio-name">{profileData.user.firstName} {profileData.user.lastName}</div>
        <div style={{marginTop: '5px'}}>{profileData.user.bio || 'Welcome to my profile.'}</div>
      </div>

      <div className="ig-action-buttons">
        {isOwnProfile ? (
          <>
            <button className="ig-btn" onClick={handleEditProfile}>Edit profile</button>
            <button className="ig-btn" onClick={() => fileInputRef.current?.click()}>Change Photo</button>
            <button className="ig-btn" onClick={handleShareProfile}>Share profile</button>
            <input type="file" accept="image/*" ref={fileInputRef} style={{display: 'none'}} onChange={handleUploadAvatar} />
          </>
        ) : (
          <>
            {profileData.friendshipStatus === 'none' && (
              <button className="ig-btn ig-btn-primary" onClick={handleFriendRequest}>Follow</button>
            )}
            {profileData.friendshipStatus === 'request_sent' && (
              <button className="ig-btn" disabled>Requested</button>
            )}
            {profileData.friendshipStatus === 'request_received' && (
              <button className="ig-btn ig-btn-primary" onClick={handleAcceptRequest}>Accept Follow</button>
            )}
            {profileData.friendshipStatus === 'friends' && (
              <button className="ig-btn" disabled>Following</button>
            )}
            <button className="ig-btn">Message</button>
          </>
        )}
      </div>

      <div style={{borderTop: '1px solid #dbdbdb', paddingTop: '15px', marginTop: '20px'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px'}}>
          {posts.map(post => (
            <div key={post.id} style={{aspectRatio: '1/1', overflow: 'hidden'}}>
               {post.image ? (
                 <img src={post.image} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
               ) : (
                 <div style={{width: '100%', height: '100%', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', padding: '10px', textAlign: 'center'}}>
                    {post.content.substring(0, 50)}...
                 </div>
               )}
            </div>
          ))}
        </div>
        {posts.length === 0 && <p style={{textAlign: 'center', color: '#8e8e8e', marginTop: '40px'}}>No posts yet</p>}
      </div>
    </div>
  );
};

export default Profile;
