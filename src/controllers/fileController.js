// src/controllers/fileController.js
const { File, User } = require('../models');
const fs = require('fs');
const path = require('path');

// Upload a file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    const { originalname, filename, mimetype, size, path: filePath } = req.file;
    const { chatId } = req.body;
    
    // Create file record
    const newFile = await File.create({
      originalName: originalname,
      storedName: filename,
      mimeType: mimetype,
      size,
      uploadedBy: userId,
      path: filePath,
      chatId: chatId || null
    });
    
    // Update user's storage used
    await User.increment('storageUsed', {
      by: size,
      where: { id: userId }
    });
    
    return res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: newFile.id,
        originalName: newFile.originalName,
        mimeType: newFile.mimeType,
        size: newFile.size,
        url: `/api/files/${newFile.id}/download`
      }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    return res.status(500).json({ message: 'Error uploading file' });
  }
};

// Download a file
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Find file record
    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if file exists on disk
    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download file error:', error);
    return res.status(500).json({ message: 'Error downloading file' });
  }
};

// Delete a file
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    
    // Find file record
    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if user owns the file or is admin
    if (file.uploadedBy !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }
    
    // Delete file from disk
    const filePath = path.resolve(file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update user's storage used
    await User.decrement('storageUsed', {
      by: file.size,
      where: { id: file.uploadedBy }
    });
    
    // Delete file record
    await file.destroy();
    
    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({ message: 'Error deleting file' });
  }
};