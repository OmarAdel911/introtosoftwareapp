const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Test endpoint to check if verification routes are working
router.get('/test', async (req, res) => {
  try {
    res.json({
      message: 'Verification test endpoint',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Error in verification test endpoint'
    });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const dir = 'uploads/verification';
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get verification status
router.get('/status', async (req, res) => {
  try {
    console.log('Verification status route called, user:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('No user found in verification request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const verification = await prisma.idVerification.findUnique({
      where: { userId: req.user.id }
    });

    console.log('Found verification:', verification ? verification.status : 'NOT_SUBMITTED');
    res.json({
      status: verification ? verification.status : 'NOT_SUBMITTED',
      details: verification
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
});

// Submit ID verification
router.post('/submit', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const { documentType, documentNumber } = req.body;

    if (!documentType || !documentNumber) {
      return res.status(400).json({ error: 'Document type and number are required' });
    }

    // Check if user already has a verification record
    const existingVerification = await prisma.idVerification.findUnique({
      where: { userId: req.user.id }
    });

    if (existingVerification) {
      // Delete old document file if it exists
      if (existingVerification.documentImage) {
        try {
          await fs.unlink(existingVerification.documentImage);
        } catch (error) {
          console.error('Error deleting old document:', error);
        }
      }

      // Update existing verification
      const updatedVerification = await prisma.idVerification.update({
        where: { userId: req.user.id },
        data: {
          documentType,
          documentNumber,
          documentImage: req.file.path,
          status: 'PENDING',
          verifiedAt: null,
          verificationMethod: null,
          rejectionReason: null,
          verifiedBy: null
        }
      });

      return res.json({
        message: 'Verification document updated successfully',
        verification: updatedVerification
      });
    }

    // Create new verification record
    const verification = await prisma.idVerification.create({
      data: {
        userId: req.user.id,
        documentType,
        documentNumber,
        documentImage: req.file.path,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      message: 'Verification document submitted successfully',
      verification
    });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ error: 'Failed to submit verification document' });
  }
});

// Admin route to review verification
router.post('/review/:userId', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }

    const { userId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required when rejecting verification' });
    }

    const verification = await prisma.idVerification.update({
      where: { userId },
      data: {
        status,
        verifiedAt: status === 'APPROVED' ? new Date() : null,
        verificationMethod: 'MANUAL',
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedBy: req.user.id
      }
    });

    res.json({
      message: `Verification ${status.toLowerCase()} successfully`,
      verification
    });
  } catch (error) {
    console.error('Error reviewing verification:', error);
    res.status(500).json({ error: 'Failed to review verification' });
  }
});

module.exports = router; 