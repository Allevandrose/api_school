const { Chat, User, File } = require('../models');
const { Op } = require('sequelize');

// Get chat contacts for current user
exports.getChatContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Determine which user roles to fetch based on current user's role
    let roleFilter = {};
    
    if (userRole === 'student') {
      // Students can chat with teachers and admins
      roleFilter = { role: { [Op.in]: ['teacher', 'admin'] } };
    } else if (userRole === 'teacher') {
      // Teachers can chat with students and admins
      roleFilter = { role: { [Op.in]: ['student', 'admin'] } };
    } else if (userRole === 'admin') {
      // Admins can chat with everyone
      roleFilter = { role: { [Op.in]: ['student', 'teacher', 'admin'] } };
    }
    
    // Fetch users excluding current user
    const contacts = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        isActive: true,
        ...roleFilter
      },
      attributes: ['id', 'username', 'name', 'role', 'subject'],
      order: [['role', 'ASC'], ['name', 'ASC']]
    });
    
    // Get unread message counts for each contact
    for (const contact of contacts) {
      const unreadCount = await Chat.count({
        where: {
          senderId: contact.id,
          receiverId: userId,
          isRead: false
        }
      });
      
      contact.dataValues.unreadCount = unreadCount;
    }
    
    return res.status(200).json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    return res.status(500).json({ message: 'Error fetching chat contacts' });
  }
};

// Get chat history with a specific user
exports.getChatHistory = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.id;
    
    // Validate contact exists
    const contact = await User.findByPk(contactId);
    if (!contact || !contact.isActive) {
      return res.status(404).json({ message: 'Contact not found or inactive' });
    }
    
    // Fetch chat messages between users
    const messages = await Chat.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: contactId },
          { senderId: contactId, receiverId: userId }
        ]
      },
      order: [['timestamp', 'ASC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'name', 'role']
        },
        {
          model: File,
          as: 'file',
          attributes: ['id', 'url', 'name', 'type', 'size']
        }
      ]
    });
    
    // Mark unread messages as read
    await Chat.update(
      { isRead: true },
      {
        where: {
          senderId: contactId,
          receiverId: userId,
          isRead: false
        }
      }
    );
    
    return res.status(200).json({ 
      contact: {
        id: contact.id,
        username: contact.username,
        name: contact.name,
        role: contact.role,
        subject: contact.subject
      },
      messages 
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json({ message: 'Error fetching chat history' });
  }
};

// Send a message to another user
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const fileId = req.file ? req.file.id : null; // Get file ID from upload
    const senderId = req.user.id;
    
    // Validate receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver || !receiver.isActive) {
      return res.status(404).json({ message: 'Receiver not found or inactive' });
    }
    
    // Validate message content
    if (!message && !fileId) {
      return res.status(400).json({ message: 'Message content or file is required' });
    }
    
    // Create chat message
    const newChat = await Chat.create({
      senderId,
      receiverId,
      message,
      fileId
    });
    
    // Include sender and file info in response
    const chatWithDetails = await Chat.findByPk(newChat.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'name', 'role']
        },
        {
          model: File,
          as: 'file',
          attributes: ['id', 'url', 'name', 'type', 'size']
        }
      ]
    });
    
    // If we have Socket.IO set up, emit the message
    if (req.io) {
      req.io.to(`user_${receiverId}`).emit('new_message', chatWithDetails);
    }
    
    return res.status(201).json({
      message: 'Message sent successfully',
      chat: chatWithDetails
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Error sending message' });
  }
};