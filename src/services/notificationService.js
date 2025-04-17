// src/services/notificationService.js
const { Notification } = require('../models');
const { ROLES } = require('../utils/constants');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async createNotification(title, message, createdBy, isPublic = true) {
    const notification = await Notification.create({
      title,
      message,
      createdBy,
      isPublic
    });

    if (isPublic) {
      this.io.emit('new_notification', notification);
    } else {
      // Send to specific roles/users if needed
    }

    return notification;
  }

  async getUnreadNotifications(userId) {
    return await Notification.findAll({
      include: [{
        model: NotificationRead,
        where: { userId },
        required: false
      }]
    });
  }
}

module.exports = NotificationService;