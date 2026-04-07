import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import Post from '../components/Post';
import Spinner from '../components/Spinner';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  
  // Infinite scroll states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);
  
  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/posts/feed?page=${page}&limit=5`);
      const newPosts = res.data.data.posts;
      
      setPosts(prev => {
        // Filter out duplicates (if any new ones arrived while scrolling)
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNew = newPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
      
      setHasMore(res.data.data.pagination.page < res.data.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching feed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content && !image) return;

    try {
      const formData = new FormData();
      if(content) formData.append('content', content);
      if(image) formData.append('image', image);

      await api.post('/posts', formData);
      setContent('');
      setImage(null);
      // Reset feed context to fetch from top
      if (page === 1) {
        setPosts([]);
        fetchPosts();
      } else {
        setPage(1);
        setPosts([]);
      }
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  return (
    <div className="feed-container">
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <Spinner />
          <p style={{marginTop: '15px', fontWeight: '600', color: '#262626'}}>Post uploading...</p>
        </div>
      )}

      <div className="create-post-card">
        <form onSubmit={handleCreatePost}>
          <textarea 
             placeholder="What's on your mind?" 
             value={content}
             onChange={(e) => setContent(e.target.value)}
          />
          <div className="post-actions">
            <input 
              type="file" 
              accept="image/*,video/*" 
              onChange={(e) => setImage(e.target.files[0])} 
            />
            <button type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
          </div>
        </form>
      </div>

      <div className="posts-list">
        {posts.map((post, index) => {
          if (posts.length === index + 1) {
            return <div ref={lastPostElementRef} key={post.id}><Post post={post} /></div>
          } else {
            return <Post key={post.id} post={post} />
          }
        })}
      </div>
      {loading && <Spinner />}
      {!hasMore && posts.length > 0 && <p className="no-more-posts">No more posts to fetch.</p>}
    </div>
  );
};

export default Feed;
