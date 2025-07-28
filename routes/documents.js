const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, requireRole } = require('../middleware/auth');
const db = require('../config/db-config');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Accept only common document types
  const allowedFileTypes = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
    '.txt', '.csv', '.jpg', '.jpeg', '.png'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only document files are allowed.'), false);
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 // 5MB default
  }
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum file size is 5MB.' 
      });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// @route   POST /api/documents/upload/:employeeId
// @desc    Upload document for an employee
// @access  Private (HR Admin, Team Lead)
router.post(
  '/upload/:employeeId',
  auth,
  requireRole(['HR_ADMIN', 'TEAM_LEAD']),
  upload.single('document'),
  handleMulterError,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { documentType, notes } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      if (!documentType) {
        return res.status(400).json({ message: 'Document type is required' });
      }
      
      // Check if employee exists
      const employee = await db.getEmployeeById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Save document metadata to database
      // In a real implementation, this would insert into the documents table
      const document = {
        id: Date.now(),
        employeeId,
        documentType,
        fileName: req.file.filename,
        filePath: req.file.path,
        uploadDate: new Date(),
        notes: notes || ''
      };
      
      // Log the document upload
      console.log(`Document uploaded: ${document.fileName} for employee ${employeeId}`);
      
      res.status(201).json({
        message: 'Document uploaded successfully',
        document
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/documents/:employeeId
// @desc    Get all documents for an employee
// @access  Private (HR Admin, Team Lead, Employee - own documents only)
router.get(
  '/:employeeId',
  auth,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Check if employee exists
      const employee = await db.getEmployeeById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Check permissions - employees can only view their own documents
      if (req.user.role === 'Employee' && req.user.id !== parseInt(employeeId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // In a real implementation, this would query the documents table
      // For now, we'll return a mock response
      const documents = [
        {
          id: 1,
          employeeId,
          documentType: 'Resume',
          fileName: 'resume.pdf',
          uploadDate: new Date(),
          notes: 'Latest resume'
        },
        {
          id: 2,
          employeeId,
          documentType: 'ID Proof',
          fileName: 'id_card.jpg',
          uploadDate: new Date(),
          notes: 'Government ID'
        }
      ];
      
      res.json(documents);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/documents/download/:documentId
// @desc    Download a document
// @access  Private (HR Admin, Team Lead, Employee - own documents only)
router.get(
  '/download/:documentId',
  auth,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      
      // In a real implementation, this would query the document by ID
      // For now, we'll use a mock document
      const document = {
        id: documentId,
        employeeId: '1',
        documentType: 'Resume',
        fileName: 'resume.pdf',
        filePath: path.join(__dirname, '..', 'uploads', 'documents', 'sample.pdf'),
        uploadDate: new Date(),
        notes: 'Latest resume'
      };
      
      // Check if document exists
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Check permissions - employees can only download their own documents
      if (req.user.role === 'Employee' && req.user.id !== parseInt(document.employeeId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Send file
      res.download(document.filePath, document.fileName);
    } catch (error) {
      console.error('Document download error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/documents/:documentId
// @desc    Delete a document
// @access  Private (HR Admin only)
router.delete(
  '/:documentId',
  auth,
  requireRole(['HR_ADMIN']),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      
      // In a real implementation, this would query the document by ID
      // For now, we'll use a mock document
      const document = {
        id: documentId,
        employeeId: '1',
        documentType: 'Resume',
        fileName: 'resume.pdf',
        filePath: path.join(__dirname, '..', 'uploads', 'documents', 'sample.pdf'),
        uploadDate: new Date(),
        notes: 'Latest resume'
      };
      
      // Check if document exists
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Delete file if it exists
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
      
      // In a real implementation, this would delete from the database
      console.log(`Document deleted: ${document.fileName} for employee ${document.employeeId}`);
      
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Document deletion error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
