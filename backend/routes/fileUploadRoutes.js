const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { uploadFile, deleteFile, getSignedUrl } = require('../utils/cloudinary');
const fs = require('fs');

const prisma = new PrismaClient();

// Configure multer for memory storage (no local files)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, and images are allowed.'));
    }
  }
});

// Upload a single file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse metadata if provided
    let metadata = {};
    try {
      metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    } catch (error) {
      console.error('Error parsing metadata:', error);
      metadata = {};
    }

    // Determine folder based on file type
    let folder = 'uploads';
    if (metadata.type === 'resume') {
      folder = 'resumes';
    } else if (req.file.mimetype && req.file.mimetype.includes('image')) {
      folder = 'images';
    }

    // Convert buffer to base64 for Cloudinary
    const fileBuffer = req.file.buffer;
    const base64File = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;

    // Determine resource type and format
    const isPDF = req.file.mimetype === 'application/pdf';
    const resourceType = isPDF ? 'raw' : 'auto';
    const format = isPDF ? 'pdf' : undefined;

    // Upload to Cloudinary
    const result = await uploadFile(base64File, {
      folder: folder,
      resource_type: resourceType,
      format: format
    });

    if (!result || !result.secure_url) {
      throw new Error('Failed to upload file to Cloudinary');
    }

    // Create file record in database
    const fileRecord = await prisma.fileStorage.create({
      data: {
        filename: req.file.originalname,
        path: result.public_id,
        mimeType: req.file.mimetype,
        size: req.file.size,
        metadata: metadata,
        userId: req.user.id,
        cloudinaryUrl: result.secure_url
      },
    });

    // Return the file information
    res.json({
      id: fileRecord.id,
      filename: fileRecord.filename,
      path: fileRecord.path,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      url: fileRecord.cloudinaryUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message || 'An unexpected error occurred'
    });
  }
});

// Upload multiple files
router.post('/upload-multiple', auth, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = await Promise.all(
      req.files.map(async (file) => {
        // Determine folder based on file type
        let folder = 'uploads';
        if (file.mimetype.startsWith('image/')) {
          folder = 'images';
        }

        // Upload to Cloudinary
        const result = await uploadFile(file.path, {
          folder: folder,
          resource_type: file.mimetype === "application/pdf" ? "raw" : "auto",
          format: file.mimetype === "application/pdf" ? "pdf" : undefined
        });

        // Create file record in database
        const fileRecord = await prisma.fileStorage.create({
          data: {
            filename: file.originalname,
            path: result.public_id,
            mimeType: file.mimetype,
            size: file.size,
            metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
            userId: req.user.id,
            cloudinaryUrl: result.secure_url
          }
        });

        // Clean up temporary file
        fs.unlinkSync(file.path);

        return {
          ...fileRecord,
          url: fileRecord.cloudinaryUrl
        };
      })
    );

    res.json(files);
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Error uploading files' });
  }
});

// Get all files for a user
router.get('/files', auth, async (req, res) => {
  try {
    const files = await prisma.fileStorage.findMany({
      where: {
        userId: req.user.id
      }
    });

    // Add Cloudinary URLs to files
    const filesWithUrls = files.map(file => {
      // For PDFs, use the stored URL directly
      if (file.mimeType === 'application/pdf') {
        return {
          ...file,
          url: file.cloudinaryUrl
        };
      }
      // For other files, use signed URL if needed
      return {
        ...file,
        url: file.cloudinaryUrl || getSignedUrl(file.path)
      };
    });

    res.json(filesWithUrls);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Error fetching files' });
  }
});

// Get a specific file
router.get('/files/:fileId', auth, async (req, res) => {
  try {
    const file = await prisma.fileStorage.findUnique({
      where: {
        id: req.params.fileId
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to file' });
    }

    // For PDFs, use the stored URL directly
    if (file.mimeType === 'application/pdf') {
      return res.json({
        id: file.id,
        filename: file.filename,
        path: file.path,
        mimeType: file.mimeType,
        size: file.size,
        url: file.cloudinaryUrl
      });
    }

    // For other files, use signed URL if needed
    const fileUrl = file.cloudinaryUrl || getSignedUrl(file.path);
    res.json({
      id: file.id,
      filename: file.filename,
      path: file.path,
      mimeType: file.mimeType,
      size: file.size,
      url: fileUrl
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Error fetching file' });
  }
});

// Delete a file
router.delete('/files/:fileId', auth, async (req, res) => {
  try {
    const file = await prisma.fileStorage.findUnique({
      where: {
        id: req.params.fileId
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to file' });
    }

    // Delete file from Cloudinary
    await deleteFile(file.path);

    // Delete file record from database
    await prisma.fileStorage.delete({
      where: {
        id: req.params.fileId
      }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Error deleting file' });
  }
});

// Update file metadata
router.put('/files/:fileId', auth, async (req, res) => {
  try {
    const file = await prisma.fileStorage.findUnique({
      where: {
        id: req.params.fileId
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to file' });
    }

    const updatedFile = await prisma.fileStorage.update({
      where: {
        id: req.params.fileId
      },
      data: {
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : file.metadata
      }
    });

    // Add Cloudinary URL to updated file
    const fileUrl = updatedFile.cloudinaryUrl || getSignedUrl(updatedFile.path);

    res.json({
      ...updatedFile,
      url: fileUrl
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Error updating file' });
  }
});

module.exports = router; 