// src/routes/fileRoutes.js
const express = require('express');
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth');
const { upload, checkStorageLimit } = require('../middleware/upload');

const router = express.Router();

// File routes (protected)
router.post('/upload', auth, checkStorageLimit, upload.single('file'), fileController.uploadFile);
router.get('/:fileId/download', auth, fileController.downloadFile);
router.delete('/:fileId', auth, fileController.deleteFile);

module.exports = router;