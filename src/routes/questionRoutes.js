// src/routes/questionRoutes.js
const express = require('express');
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');
const { isAdmin, isStudent } = require('../middleware/roleCheck');

const router = express.Router();

// Category routes
router.post('/categories', auth, isAdmin, questionController.createCategory);
router.get('/categories', auth, questionController.getAllCategories);

// Question routes
router.post('/', auth, isAdmin, questionController.createQuestion);
router.get('/category/:categoryId', auth, questionController.getQuestionsByCategory);

// Student response routes
router.post('/submit', auth, isStudent, questionController.submitAnswers);

// Feedback routes (admin only)
router.get('/feedback', auth, isAdmin, questionController.getFeedback);

module.exports = router;