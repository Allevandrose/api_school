// src/utils/helpers.js
const { v4: uuidv4 } = require('uuid');

exports.formatDate = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

exports.generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = uuidv4().substring(0, 8);
  return `${timestamp}-${randomString}-${originalName}`;
};

exports.calculateStorageUsage = (files) => {
  return files.reduce((total, file) => total + file.size, 0);
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
};