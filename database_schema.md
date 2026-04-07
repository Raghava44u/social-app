# Social Media Full-Stack Project Handover

## 1. Raw MySQL Implementation (Schema Setup)

Although `npm run db:sync` leverages Sequelize to build the database automatically, here are the actual raw SQL queries answering your requirement. This is the exact schema Sequelize resolves to, with relations and indexing:

```sql
-- 1. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  bio TEXT,
  profile_image VARCHAR(500),
  cover_image VARCHAR(500),
  is_online BOOLEAN DEFAULT FALSE,
  last_seen DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- 2. Posts Table
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT,
  image_url VARCHAR(500),
  original_post_id INT,
  shared_by INT,
  share_text TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (original_post_id) REFERENCES posts(id) ON DELETE SET NULL,
  FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Comments Table
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Likes Table
CREATE TABLE likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (post_id, user_id)
);

-- 5. Friend Requests Table
CREATE TABLE friend_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_request (sender_id, receiver_id)
);

-- 6. Friends Table
CREATE TABLE friends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  friend_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_friendship (user_id, friend_id)
);

-- 7. Notifications Table
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  from_user_id INT NOT NULL,
  type ENUM('friend_request', 'friend_accept', 'post_like', 'post_comment', 'post_share') NOT NULL,
  reference_id INT,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_post_created ON posts(created_at);
CREATE INDEX idx_post_userid ON posts(user_id);
```

---

## 2. API Verification Steps (Local Testing)

Once the backend is running, verify APIs sequentially using Postman, Insomnia, or ThunderClient:

1. **Test Registration:** `POST http://localhost:5000/api/auth/register` (Pass username, email, password)
2. **Test Login:** `POST http://localhost:5000/api/auth/login` (Ensure it returns the JWT token)
3. **Capture JWT Token:** Set this as `Bearer Token` in your headers for all subsequent requests.
4. **Create a Post:** `POST http://localhost:5000/api/posts` (form-data: add `content`. You can optionally attach an `image` if Cloudinary `.env` keys exist).
5. **Like a Post:** `POST http://localhost:5000/api/posts/:id/like`
6. **Fetch Feed:** `GET http://localhost:5000/api/posts/feed`

---

## 3. How to Run Locally

### MySQL Setup
1. Open MySQL Workbench or your CLI.
2. Run `CREATE DATABASE social_app;`
3. Update your `.env` in the `backend` folder to match your native root user credentials.

### Backend Start
```bash
# In the first terminal
cd backend
npm run db:sync    # Auto-creates all tables in MySQL
npm run dev        # Starts nodemon on localhost:5000
```

### Frontend Start
```bash
# In the second terminal
cd frontend
npm install        # Will take ~15 seconds, setting up your React node_modules env
npm run dev        # Starts Vite on localhost:3000
```

---

## 4. Preparing for Render Deployment

To deploy this later to Render, you will treat them as two separate deployment web services hooked together.

### Backend (Render Web Service)
1. Add a start script in `backend/package.json`: `"start": "node server.js"`
2. Set Environment Variables in the Render Dashboard specifically (e.g., `JWT_SECRET`, `CLIENT_URL=https://your-frontend.onrender.com`).
3. For MySQL, you can use Render's PostgreSQL natively by switching the `sequelize` dialect, OR you must host MySQL externally (e.g. Aiven, PlanetScale, Railway) and paste the URI link into Render. Localhost MySQL will NOT work on the cloud!

### Frontend (Render Static Site)
1. In Render, deploy `frontend` as a Static Site.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Make sure to update your `api/axios.js` file to route the Base URL dynamically:
```javascript
baseURL: import.meta.env.PROD 
   ? 'https://your-backend.onrender.com/api' 
   : 'http://localhost:5000/api'
```
