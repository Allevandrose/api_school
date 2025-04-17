const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const File = require('./File'); // Import File model for association

// Updated Chat model with proper File association
const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fileId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Files',
      key: 'id'
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chats',
  timestamps: false // If you want to use the `timestamp` field instead of default Sequelize timestamps
});

// Association with File model
Chat.belongsTo(File, {
  foreignKey: 'fileId',
  as: 'file',
  onDelete: 'SET NULL'
});

module.exports = Chat;