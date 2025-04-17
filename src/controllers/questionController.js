const { Question, Answer, Category, StudentResponse, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Admin: Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const newCategory = await Category.create({
      name,
      description
    });
    
    return res.status(201).json({
      message: 'Category created successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Error creating category' });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Question,
          attributes: ['id']
        }
      ]
    });
    
    // Transform the data to include question count
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      questionCount: category.Questions.length,
      createdAt: category.createdAt
    }));
    
    return res.status(200).json({ categories: formattedCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Admin: Create a new question with answers
exports.createQuestion = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const { text, categoryId, answers } = req.body;
    
    // Validate inputs
    if (!text || !categoryId || !answers || !Array.isArray(answers) || answers.length < 2) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Question text, category ID, and at least 2 possible answers are required' 
      });
    }
    
    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Create question
    const newQuestion = await Question.create({
      text,
      categoryId
    }, { transaction });
    
    // Create answers for the question
    const createdAnswers = await Promise.all(
      answers.map(answer => Answer.create({
        text: answer.text,
        questionId: newQuestion.id,
        isCorrect: !!answer.isCorrect
      }, { transaction }))
    );
    
    await transaction.commit();
    
    return res.status(201).json({
      message: 'Question created successfully',
      question: {
        id: newQuestion.id,
        text: newQuestion.text,
        categoryId: newQuestion.categoryId,
        answers: createdAnswers.map(answer => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect
        }))
      }
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Create question error:', error);
    return res.status(500).json({ message: 'Error creating question' });
  }
};

// Get questions by category ID
exports.getQuestionsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Fetch questions with answers
    const questions = await Question.findAll({
      where: { 
        categoryId,
        isActive: true 
      },
      include: [
        {
          model: Answer,
          attributes: ['id', 'text', 'isCorrect']
        }
      ]
    });
    
    // If user is a student, check if they've already answered the questions
    if (req.user.role === 'student') {
      const studentId = req.user.id;
      
      // Get all responses from this student
      const responses = await StudentResponse.findAll({
        where: { studentId },
        attributes: ['questionId']
      });
      
      // Filter out questions that have been answered
      const answeredQuestionIds = responses.map(response => response.questionId);
      const unansweredQuestions = questions.filter(
        question => !answeredQuestionIds.includes(question.id)
      );
      
      // Remove isCorrect flag from answers for students
      const sanitizedQuestions = unansweredQuestions.map(question => ({
        id: question.id,
        text: question.text,
        categoryId: question.categoryId,
        answers: question.Answers.map(answer => ({
          id: answer.id,
          text: answer.text
        }))
      }));
      
      return res.status(200).json({ 
        category: category.name,
        questions: sanitizedQuestions 
      });
    }
    
    // For admin/teachers, return all questions with full details
    return res.status(200).json({ 
      category: category.name,
      questions 
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return res.status(500).json({ message: 'Error fetching questions' });
  }
};

// Student: Submit answers to questions
exports.submitAnswers = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { responses } = req.body;
    const studentId = req.user.id;
    
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No responses provided' });
    }
    
    // Validate that all responses have questionId and answerId
    for (const response of responses) {
      if (!response.questionId || !response.answerId) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Each response must include questionId and answerId' 
        });
      }
    }
    
    // Validate questions exist and are active
    const questionIds = responses.map(r => r.questionId);
    const validQuestions = await Question.findAll({
      where: {
        id: { [Op.in]: questionIds },
        isActive: true
      }
    });
    
    const validQuestionIds = validQuestions.map(q => q.id);
    const invalidQuestions = questionIds.filter(id => !validQuestionIds.includes(id));
    
    if (invalidQuestions.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Some questions are invalid or inactive: ${invalidQuestions.join(', ')}` 
      });
    }
    
    // Validate answers exist and belong to questions
    const answerValidations = await Promise.all(
      responses.map(async response => {
        const answer = await Answer.findOne({
          where: {
            id: response.answerId,
            questionId: response.questionId
          }
        });
        return answer ? null : response.questionId;
      })
    );
    
    const invalidAnswers = answerValidations.filter(id => id !== null);
    
    if (invalidAnswers.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Some answers are invalid for questions: ${invalidAnswers.join(', ')}` 
      });
    }
    
    // Check if student has already answered any of these questions
    const existingResponses = await StudentResponse.findAll({
      where: {
        studentId,
        questionId: { [Op.in]: questionIds }
      }
    });
    
    if (existingResponses.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Some questions have already been answered' 
      });
    }
    
    // Create student responses
    await Promise.all(
      responses.map(response => StudentResponse.create({
        studentId,
        questionId: response.questionId,
        answerId: response.answerId
      }, { transaction }))
    );
    
    await transaction.commit();
    
    return res.status(201).json({
      message: 'Responses submitted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Submit answers error:', error);
    return res.status(500).json({ message: 'Error submitting answers' });
  }
};

// Admin: Get feedback from students
exports.getFeedback = async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    // Base query
    let queryOptions = {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'username', 'name']
        },
        {
          model: Question,
          include: [
            {
              model: Category,
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Answer,
          attributes: ['id', 'text', 'isCorrect']
        }
      ],
      order: [['submittedAt', 'DESC']]
    };
    
    // Add category filter if provided
    if (categoryId) {
      queryOptions.include[1].where = { categoryId };
    }
    
    // Fetch student responses
    const responses = await StudentResponse.findAll(queryOptions);
    
    // Format responses
    const formattedResponses = responses.map(response => ({
      id: response.id,
      student: {
        id: response.student.id,
        username: response.student.username,
        name: response.student.name
      },
      question: {
        id: response.Question.id,
        text: response.Question.text,
        category: {
          id: response.Question.Category.id,
          name: response.Question.Category.name
        }
      },
      answer: {
        id: response.Answer.id,
        text: response.Answer.text,
        isCorrect: response.Answer.isCorrect
      },
      submittedAt: response.submittedAt
    }));
    
    return res.status(200).json({ feedback: formattedResponses });
  } catch (error) {
    console.error('Get feedback error:', error);
    return res.status(500).json({ message: 'Error fetching feedback' });
  }
};