// src/models/File.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const File = sequelize.define('File', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  storedName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  chatId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Chats',
      key: 'id'
    }
  }
});

module.exports = File;