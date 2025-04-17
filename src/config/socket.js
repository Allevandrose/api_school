const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('Authentication required');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      socket.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.user.username} (${socket.user.id})`);
    
    // Join personal and role-based rooms
    socket.join(`user_${socket.user.id}`);
    socket.join(`role_${socket.user.role}`);

    // Typing indicator
    socket.on('typing', (data) => {
      const receiverId = data.receiverId;
      if (receiverId) {
        socket.to(`user_${receiverId}`).emit('typing', {
          senderId: socket.user.id,
          username: socket.user.username
        });
      }
    });

    // Message delivery confirmation
    socket.on('message_delivered', (data) => {
      socket.to(`user_${data.senderId}`).emit('message_delivered', data);
    });

    // Notification broadcast
    socket.on('new_notification', (notification) => {
      // Only allow admins to send notifications
      if (socket.user.role === 'admin') {
        // Determine target room based on notification targetRole
        const targetRoom = notification.targetRole 
          ? `role_${notification.targetRole}` 
          : 'role_all'; // Default to all users
        
        // Broadcast notification to target room
        io.to(targetRoom).emit('new_notification', notification);
      }
    });

    // File upload progress
    socket.on('upload_progress', (data) => {
      socket.to(`user_${data.receiverId}`).emit('upload_progress', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.user.username} (${socket.user.id})`);
    });
  });

  return io;
}

module.exports = setupSocketIO;