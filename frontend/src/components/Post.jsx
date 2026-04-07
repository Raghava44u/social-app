import React, { useState, useContext, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Heart, MessageCircle, Send } from 'lucide-react';

const Post = memo(({ post, allowDelete }) => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (socket) {
      const handlePostUpdated = (data) => {
        if (data.postId === post.id) {
          if (data.type === 'like') {
            setLikesCount(data.likesCount);
          } else if (data.type === 'comment') {
            setCommentsCount(data.commentsCount);
          }
        }
      };
      socket.on('post_updated', handlePostUpdated);
      return () => {
        socket.off('post_updated', handlePostUpdated);
      };
    }
  }, [socket, post.id]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await api.delete(`/posts/${post.id}/like`);
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await api.post(`/posts/${post.id}/like`);
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    if (!showComments) {
      try {
        const res = await api.get(`/comments/${post.id}`);
        setComments(res.data.data.comments);
      } catch (err) {
        console.error(err);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/comments/${post.id}`, { content: newComment });
      setComments([res.data.data.comment, ...comments]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    try {
      await api.post(`/posts/${post.id}/share`);
      alert("Post shared successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await api.delete(`/posts/${post.id}`);
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="ig-post-card">
      <div className="ig-post-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <Link to={`/profile/${post.author?.id}`}>
             {post.author?.profileImage ? (
               <img src={post.author.profileImage} alt="avatar" className="ig-post-avatar" />
             ) : (
               <div className="ig-post-avatar" style={{background: '#dbdbdb', display: 'flex', alignItems: 'center', justifyContent:'center'}}>{post.author?.username?.[0]}</div>
             )}
          </Link>
          <Link to={`/profile/${post.author?.id}`} className="ig-post-username">
            {post.author?.username?.toLowerCase()}
          </Link>
        </div>
        {allowDelete && user?.id === post.author?.id && (
          <button onClick={handleDeletePost} style={{marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '12px'}}>Delete</button>
        )}
      </div>

      {post.imageUrl && <img src={post.imageUrl} alt="post" className="ig-post-image" />}
      {!post.imageUrl && <div style={{padding: '20px 14px', fontSize: '1.2rem'}}>{post.content}</div>}

      <div className="ig-post-actions">
        <button onClick={handleLike} style={{ color: isLiked ? '#ed4956' : '#000' }}>
          <Heart size={24} fill={isLiked ? '#ed4956' : 'none'} color={isLiked ? '#ed4956' : '#000'} strokeWidth={1.5} />
        </button>
        <button onClick={fetchComments}>
          <MessageCircle size={24} color="#000" strokeWidth={1.5} />
        </button>
        <button onClick={handleShare}>
          <Send size={24} color="#000" strokeWidth={1.5} />
        </button>
      </div>

      <div className="ig-post-likes">
        {likesCount.toLocaleString()} likes
      </div>

      <div className="ig-post-caption">
        <Link to={`/profile/${post.author?.id}`}>{post.author?.username?.toLowerCase()}</Link>
        {post.imageUrl ? post.content : ''}
      </div>

      {showComments && (
        <div className="comments-section" style={{padding: '10px 14px', borderTop: 'none'}}>
          <div className="comments-list">
            {comments.map(c => (
              <div key={c.id} className="comment" style={{background: 'none', padding: '5px 0', border: 'none'}}>
                <strong>{c.user?.username}</strong> {c.content}
              </div>
            ))}
          </div>
          <form className="add-comment" onSubmit={handleAddComment}>
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{background: 'none', border: 'none', padding: '0'}}
            />
            <button type="submit" style={{background: 'none', color: '#0095f6', fontWeight: '600'}}>Post</button>
          </form>
        </div>
      )}
    </div>
  );
});

export default Post;
