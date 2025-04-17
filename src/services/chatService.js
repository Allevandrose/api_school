// src/services/chatService.js
const { Chat, User } = require('../models');
const { ROLES } = require('../utils/constants');

class ChatService {
  constructor(io) {
    this.io = io;
  }

  async sendMessage(senderId, receiverId, message, fileId = null) {
    const newChat = await Chat.create({
      senderId,
      receiverId,
      message,
      fileId
    });

    const populatedChat = await Chat.findByPk(newChat.id, {
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'role']
      }]
    });

    this.io.to(`user_${receiverId}`).emit('new_message', populatedChat);
    return populatedChat;
  }

  async markMessagesAsRead(userId, senderId) {
    await Chat.update(
      { isRead: true },
      {
        where: {
          senderId,
          receiverId: userId,
          isRead: false
        }
      }
    );
  }

  async getUnreadCount(userId) {
    return await Chat.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }
}

module.exports = ChatService;