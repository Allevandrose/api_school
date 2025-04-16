// src/controllers/userController.js
const { User } = require('../models');
const bcrypt = require('bcrypt');

// Admin: Create a teacher account
exports.createTeacher = async (req, res) => {
  try {
    const { username, password, name, subject } = req.body;

    if (!username || !password || !name || !subject) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newTeacher = await User.create({
      username,
      password,
      name,
      subject,
      role: 'teacher'
    });

    return res.status(201).json({
      message: 'Teacher account created successfully',
      user: {
        id: newTeacher.id,
        username: newTeacher.username,
        name: newTeacher.name,
        subject: newTeacher.subject,
        role: newTeacher.role
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    return res.status(500).json({ message: 'Error creating teacher account' });
  }
};

// Admin: Get all users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    const users = await User.findAll({
      where: { role },
      attributes: ['id', 'username', 'name', 'subject', 'role', 'isActive', 'createdAt']
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

// Admin: Deactivate/Activate user account
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Cannot modify admin accounts' });
    }

    await user.update({ isActive });

    return res.status(200).json({
      message: isActive ? 'User activated successfully' : 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return res.status(500).json({ message: 'Error updating user status' });
  }
};

// Admin: Delete user account
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    await user.destroy();

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Error deleting user' });
  }
};

// User: Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    const user = req.user;

    const isCurrentPasswordValid = await user.validPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ message: 'Error updating password' });
  }
};

// User: Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    await user.update({ name });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        subject: user.subject
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Error updating profile' });
  }
};
