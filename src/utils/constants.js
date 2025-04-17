// src/utils/constants.js
exports.ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
  };
  
  exports.STORAGE_LIMIT = 100 * 1024 * 1024; // 100MB
  exports.MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  exports.ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4'
  ];