// src/models/StudentResponse.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentResponse = sequelize.define('StudentResponse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Questions',
      key: 'id'
    }
  },
  answerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Answers',
      key: 'id'
    }
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = StudentResponse;