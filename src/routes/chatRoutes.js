// src/routes/chatRoutes.js
const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { upload, checkStorageLimit } = require('../middleware/upload');

const router = express.Router();

// Protected chat routes
router.get('/contacts', auth, chatController.getChatContacts);
router.get('/history/:contactId', auth, chatController.getChatHistory);
router.post('/send', auth, chatController.sendMessage);

module.exports = router;