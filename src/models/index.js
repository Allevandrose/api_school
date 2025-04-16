// src/models/index.js
const User = require('./User');
const Category = require('./Category');
const Question = require('./Question');
const Answer = require('./Answer');
const StudentResponse = require('./StudentResponse');
const Chat = require('./Chat');
const Notification = require('./Notification');
const NotificationRead = require('./NotificationRead');
const File = require('./File');

// Category <-> Question associations
Category.hasMany(Question, { foreignKey: 'categoryId' });
Question.belongsTo(Category, { foreignKey: 'categoryId' });

// Question <-> Answer associations
Question.hasMany(Answer, { foreignKey: 'questionId' });
Answer.belongsTo(Question, { foreignKey: 'questionId' });

// User <-> StudentResponse associations
User.hasMany(StudentResponse, { foreignKey: 'studentId' });
StudentResponse.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

// Question <-> StudentResponse associations
Question.hasMany(StudentResponse, { foreignKey: 'questionId' });
StudentResponse.belongsTo(Question, { foreignKey: 'questionId' });

// Answer <-> StudentResponse associations
Answer.hasMany(StudentResponse, { foreignKey: 'answerId' });
StudentResponse.belongsTo(Answer, { foreignKey: 'answerId' });

// User <-> Chat associations (sender)
User.hasMany(Chat, { foreignKey: 'senderId', as: 'sentChats' });
Chat.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// User <-> Chat associations (receiver)
User.hasMany(Chat, { foreignKey: 'receiverId', as: 'receivedChats' });
Chat.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// User <-> Notification associations
User.hasMany(Notification, { foreignKey: 'createdBy' });
Notification.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Notification <-> NotificationRead associations
Notification.hasMany(NotificationRead, { foreignKey: 'notificationId' });
NotificationRead.belongsTo(Notification, { foreignKey: 'notificationId' });

// User <-> NotificationRead associations
User.hasMany(NotificationRead, { foreignKey: 'userId' });
NotificationRead.belongsTo(User, { foreignKey: 'userId' });

// User <-> File associations
User.hasMany(File, { foreignKey: 'uploadedBy' });
File.belongsTo(User, { foreignKey: 'uploadedBy' });

// Chat <-> File associations
Chat.hasMany(File, { foreignKey: 'chatId' });
File.belongsTo(Chat, { foreignKey: 'chatId' });

module.exports = {
  User,
  Category,
  Question,
  Answer,
  StudentResponse,
  Chat,
  Notification,
  NotificationRead,
  File
};