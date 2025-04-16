// src/controllers/notificationController.js
const { Notification, NotificationRead, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Admin: Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const createdBy = req.user.id;
    
    // Validate inputs
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // Create notification
    const newNotification = await Notification.create({
      title,
      message,
      createdBy
    });
    
    // If we have Socket.IO set up, broadcast the notification
    if (req.io) {
      req.io.emit('new_notification', {
        id: newNotification.id,
        title: newNotification.title,
        message: newNotification.message,
        createdAt: newNotification.createdAt
      });
    }
    
    return res.status(201).json({
      message: 'Notification created successfully',
      notification: newNotification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({ message: 'Error creating notification' });
  }
};

// Get all notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch all public notifications
    const notifications = await Notification.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'name', 'role']
        },
        {
          model: NotificationRead,
          where: { userId },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Format notifications to include read status
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      isRead: notification.NotificationReads.length > 0,
      createdBy: notification.creator,
      createdAt: notification.createdAt
    }));
    
    return res.status(200).json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    // Check if notification exists
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if already marked as read
    const existingRead = await NotificationRead.findOne({
      where: { notificationId, userId }
    });
    
    if (!existingRead) {
      // Mark as read
      await NotificationRead.create({
        notificationId,
        userId
      });
    }
    
    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ message: 'Error marking notification as read' });
  }
};
