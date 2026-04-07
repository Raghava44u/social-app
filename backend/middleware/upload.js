// ============================================
// FILE UPLOAD MIDDLEWARE (Multer)
// Handles file uploads with validation
// ============================================

const multer = require('multer');
const path = require('path');

// Configure storage (memory storage for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);   // Accept the file
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max file size
  },
});

module.exports = upload;
