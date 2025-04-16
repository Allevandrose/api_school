// src/middleware/roleCheck.js

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  };
  
  const isTeacher = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Teacher privileges required.' });
  };
  
  const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Student privileges required.' });
  };
  
  const isTeacherOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Teacher or Admin privileges required.' });
  };
  
  module.exports = {
    isAdmin,
    isTeacher,
    isStudent,
    isTeacherOrAdmin
  };