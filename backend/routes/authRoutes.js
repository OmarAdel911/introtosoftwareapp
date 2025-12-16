const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const prisma = new PrismaClient();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        role
      }
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    // Format user data to match frontend expectations
    const formattedUser = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.name.split(' ')[0],
      lastName: userWithoutPassword.name.split(' ').slice(1).join(' '),
      role: userWithoutPassword.role,
      image: userWithoutPassword.image
    };
    
    res.status(201).json({
      user: formattedUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Alias for register
router.post('/signup', async (req, res) => {
  // Forward to register
  return router._router.handle(req, res);
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    // Format user data to match frontend expectations
    const formattedUser = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.name.split(' ')[0],
      lastName: userWithoutPassword.name.split(' ').slice(1).join(' '),
      role: userWithoutPassword.role,
      image: userWithoutPassword.image
    };
    
    res.json({
      user: formattedUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    // Safely format user data
    const nameParts = userWithoutPassword.name ? userWithoutPassword.name.split(' ') : ['', ''];
    const formattedUser = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      role: userWithoutPassword.role,
      image: userWithoutPassword.image || null
    };
    
    res.json({
      success: true,
      data: {
        user: formattedUser,
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error logging in',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    
    // Format user data to match frontend expectations
    const formattedUser = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      name: userWithoutPassword.name,
      role: userWithoutPassword.role,
      image: userWithoutPassword.image ? (process.env.CLOUDINARY_CLOUD_NAME 
        ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${userWithoutPassword.image}` 
        : `https://egbackend-1.onrender.com/${userWithoutPassword.image}`) : null,
      bio: userWithoutPassword.bio,
      skills: userWithoutPassword.skills,
      hourlyRate: userWithoutPassword.hourlyRate,
      title: userWithoutPassword.title,
      location: userWithoutPassword.location,
      website: userWithoutPassword.website,
      linkedin: userWithoutPassword.linkedin,
      github: userWithoutPassword.github
    };
    
    res.json(formattedUser);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// Admin verify token route
router.get('/admin/verify', adminAuth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Admin token verified' });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Error verifying admin token' });
  }
});

module.exports = router; 