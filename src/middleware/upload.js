// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to check file types
const fileFilter = (req, file, cb) => {
  // Accept images, documents, and videos
  const allowedFileTypes = [
    // Images
    '.jpg', '.jpeg', '.png', '.gif',
    // Documents
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
    // Videos
    '.mp4', '.avi', '.mov', '.wmv'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

// Check storage limit (100MB per user)
const checkStorageLimit = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const fileSize = parseInt(req.headers['content-length'] || 0);
    const maxStorageBytes = 100 * 1024 * 1024; // 100MB in bytes
    
    if (user.storageUsed + fileSize > maxStorageBytes) {
      return res.status(400).json({ 
        message: 'Storage limit exceeded. Maximum storage is 100MB per user.' 
      });
    }
    
    req.fileSize = fileSize;
    next();
  } catch (error) {
    console.error('Storage check error:', error);
    res.status(500).json({ message: 'Error checking storage limit' });
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max file size per upload
});

module.exports = {
  upload,
  checkStorageLimit
};