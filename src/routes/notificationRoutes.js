// src/routes/notificationRoutes.js
const express = require('express');
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// Admin routes
router.post('/', auth, isAdmin, notificationController.createNotification);

// User routes (protected)
router.get('/', auth, notificationController.getNotifications);
router.patch('/:notificationId/read', auth, notificationController.markAsRead);

module.exports = router;