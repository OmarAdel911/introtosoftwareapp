const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test endpoint to check if notifications table exists
router.get('/test', async (req, res) => {
  try {
    // Try to count notifications
    const count = await prisma.notification.count();
    res.json({
      message: 'Notifications test endpoint',
      count: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Error accessing notifications table'
    });
  }
});

// Debug endpoint to check authentication
router.get('/debug', async (req, res) => {
  try {
    res.json({
      message: 'Notifications debug endpoint',
      user: req.user ? { id: req.user.id, email: req.user.email } : 'No user',
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notifications for the authenticated user
router.get('/', async (req, res) => {
  try {
    console.log('Notifications route called, user:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Found notifications:', notifications.length);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread notifications count
router.get('/unread/count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: { read: true },
    });

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read/all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    await prisma.notification.delete({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete all read notifications
router.delete('/read/all', async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
        read: true,
      },
    });

    res.json({ message: 'All read notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 