// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// Admin routes
router.post('/teachers', auth, isAdmin, userController.createTeacher);
router.get('/role/:role', auth, isAdmin, userController.getUsersByRole);
router.patch('/:userId/status', auth, isAdmin, userController.toggleUserStatus);
router.delete('/:userId', auth, isAdmin, userController.deleteUser);

// User routes (protected)
router.patch('/password', auth, userController.updatePassword);
router.patch('/profile', auth, userController.updateProfile);

module.exports = router;