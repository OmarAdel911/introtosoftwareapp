const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Test endpoint to check if certification routes are working
router.get('/test', async (req, res) => {
  try {
    res.json({
      message: 'Certification test endpoint',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Error in certification test endpoint'
    });
  }
});

// Get all certifications for the authenticated user
router.get('/', async (req, res) => {
  try {
    console.log('Certifications route called, user:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('No user found in certifications request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const certifications = await prisma.certification.findMany({
      where: { userId: req.user.id },
      orderBy: { issueDate: 'desc' },
    });

    console.log('Found certifications:', certifications.length);
    res.json(certifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific certification
router.get('/:id', async (req, res) => {
  try {
    const certification = await prisma.certification.findUnique({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!certification) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    res.json(certification);
  } catch (error) {
    console.error('Error fetching certification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new certification
router.post('/', async (req, res) => {
  try {
    const {
      name,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
    } = req.body;

    const certification = await prisma.certification.create({
      data: {
        name,
        issuer,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialId,
        credentialUrl,
        userId: req.user.id,
      },
    });

    res.status(201).json(certification);
  } catch (error) {
    console.error('Error creating certification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a certification
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
    } = req.body;

    const certification = await prisma.certification.update({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: {
        name,
        issuer,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialId,
        credentialUrl,
      },
    });

    res.json(certification);
  } catch (error) {
    console.error('Error updating certification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a certification
router.delete('/:id', async (req, res) => {
  try {
    await prisma.certification.delete({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 