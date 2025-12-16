const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware to verify if the user is authenticated and has admin role
 */
const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Add logging to see token contents
      
      if (!decoded.id) {
        return res.status(401).json({ error: 'Invalid token structure' });
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check if user is admin
      if (user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      // Update last active timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      });

      // Add user and token to request
      req.user = user;
      req.token = token;
      
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError); // Add detailed error logging
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired. Please login again.' });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token. Please login again.' });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = adminAuth; 