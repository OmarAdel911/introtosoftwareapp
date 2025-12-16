const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Test endpoint to check if portfolio routes are working
router.get('/test', async (req, res) => {
  try {
    res.json({
      message: 'Portfolio test endpoint',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Error in portfolio test endpoint'
    });
  }
});

// Get a single portfolio item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        projectUrl: true,
        createdAt: true,
        updatedAt: true,
        userId: true
      }
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    if (portfolio.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this portfolio item' });
    }

    // Transform image URL to include base URL
    const transformedPortfolio = {
      ...portfolio,
      imageUrl: portfolio.imageUrl ? `https://egbackend-1.onrender.com/${portfolio.imageUrl}` : null
    };

    res.json(transformedPortfolio);
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user's portfolio items
router.get('/', async (req, res) => {
  try {
    console.log('Portfolio route called, user:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('No user found in portfolio request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('Fetching portfolios for user:', req.user.id);
    
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        projectUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Transform image URLs to include the base URL
    const transformedPortfolios = portfolios.map(portfolio => ({
      ...portfolio,
      imageUrl: portfolio.imageUrl ? `https://egbackend-1.onrender.com/${portfolio.imageUrl}` : null
    }));

    res.json(transformedPortfolios);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create portfolio item
router.post('/', async (req, res) => {
  try {
    const { title, description, imageUrl, projectUrl } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    console.log('Creating portfolio for user:', req.user.id);

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: req.user.id,
        title,
        description,
        imageUrl,
        projectUrl
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        projectUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Transform image URL to include base URL
    const transformedPortfolio = {
      ...portfolio,
      imageUrl: portfolio.imageUrl ? `https://egbackend-1.onrender.com/${portfolio.imageUrl}` : null
    };

    res.status(201).json(transformedPortfolio);
  } catch (error) {
    console.error('Error creating portfolio item:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update portfolio item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, projectUrl } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { id }
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    if (portfolio.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this portfolio item' });
    }

    const updatedPortfolio = await prisma.portfolio.update({
      where: { id },
      data: {
        title,
        description,
        imageUrl,
        projectUrl
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        projectUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Transform image URL to include base URL
    const transformedPortfolio = {
      ...updatedPortfolio,
      imageUrl: updatedPortfolio.imageUrl ? `https://egbackend-1.onrender.com/${updatedPortfolio.imageUrl}` : null
    };

    res.json(transformedPortfolio);
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete portfolio item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id }
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    if (portfolio.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this portfolio item' });
    }

    await prisma.portfolio.delete({
      where: { id }
    });

    res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 