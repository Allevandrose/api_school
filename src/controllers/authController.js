// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.signup = async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // For students, only username and password are required
    const newUser = await User.create({
      username,
      password,
      name: name || null,
      role: 'student' // Default role for signup is student
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Error during signup process' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    // Verify password
    const isPasswordValid = await user.validPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        subject: user.subject
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Error during login process' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // User is already available from auth middleware
    const user = req.user;
    
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        subject: user.subject,
        storageUsed: user.storageUsed
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Error fetching user profile' });
  }
};