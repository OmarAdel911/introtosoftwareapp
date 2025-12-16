const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user.id);
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        bio: true,
        skills: true,
        hourlyRate: true,
        phone: true,
        location: true,
        website: true,
        linkedin: true,
        github: true,
        portfolio: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            projectUrl: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        reviews: {
          where: {
            reviewedUserId: req.user.id
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            jobs: true,
            proposals: true,
            portfolio: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform image URLs
    const transformedUser = {
      ...user,
      image: user.image ? (process.env.CLOUDINARY_CLOUD_NAME 
        ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${user.image}` 
        : `https://egbackend-1.onrender.com/${user.image}`) : null,
      portfolio: user.portfolio ? user.portfolio.map(item => ({
        ...item,
        imageUrl: item.imageUrl ? (process.env.CLOUDINARY_CLOUD_NAME 
          ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${item.imageUrl}` 
          : `https://egbackend-1.onrender.com/${item.imageUrl}`) : null
      })) : [],
      reviews: user.reviews ? user.reviews.map(review => ({
        ...review,
        user: {
          ...review.user,
          image: review.user.image ? (process.env.CLOUDINARY_CLOUD_NAME 
            ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${review.user.image}` 
            : `https://egbackend-1.onrender.com/${review.user.image}`) : null
        }
      })) : []
    };

    console.log('User found:', user.id);
    res.json(transformedUser);
  } catch (error) {
    console.error('Profile route error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching user:', id);
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        role: true
      }
    });

    if (!user) {
      console.log('User not found:', id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform image URL
    const transformedUser = {
      ...user,
      image: user.image ? (process.env.CLOUDINARY_CLOUD_NAME 
        ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${user.image}` 
        : `https://egbackend-1.onrender.com/${user.image}`) : null
    };

    console.log('User found:', id);
    res.json(transformedUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      name,
      bio,
      skills,
      hourlyRate,
      phone,
      location,
      website,
      linkedin,
      github,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        bio,
        skills,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        phone,
        location,
        website,
        linkedin,
        github,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        skills: true,
        hourlyRate: true,
        phone: true,
        location: true,
        website: true,
        linkedin: true,
        github: true,
      },
    });

    // Transform image URL
    const transformedUser = {
      ...user,
      image: user.image ? (process.env.CLOUDINARY_CLOUD_NAME 
        ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${user.image}` 
        : `https://egbackend-1.onrender.com/${user.image}`) : null
    };

    res.json(transformedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update password
router.put('/security/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedPassword,
        security: {
          update: {
            lastPasswordChange: new Date(),
          },
        },
      },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update 2FA settings
router.put('/security/2fa', auth, async (req, res) => {
  try {
    const { enabled } = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        security: {
          update: {
            twoFactorEnabled: enabled,
          },
        },
      },
    });

    res.json({ message: '2FA settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update notification preferences
router.put('/notifications', auth, async (req, res) => {
  try {
    const { email, push, marketing } = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        notifications: {
          update: {
            email,
            push,
            marketing,
          },
        },
      },
    });

    res.json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update billing information
router.put('/billing', auth, async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        billing: {
          update: {
            plan,
            paymentMethod,
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        },
      },
    });

    res.json({ message: 'Billing information updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 