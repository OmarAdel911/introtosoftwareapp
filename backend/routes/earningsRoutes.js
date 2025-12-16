const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Test endpoint to check if earnings routes are working
router.get('/test', async (req, res) => {
  try {
    res.json({
      message: 'Earnings test endpoint',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Error in earnings test endpoint'
    });
  }
});

// Get earnings summary for freelancer
router.get('/summary', async (req, res) => {
  try {
    console.log('Earnings summary route called, user:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('No user found in earnings request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'FREELANCER') {
      return res.status(403).json({ error: 'Only freelancers can access earnings' });
    }

    // Get all payments for the freelancer
    const payments = await prisma.payment.findMany({
      where: {
        freelancerId: userId
      }
    });

    // Calculate total earnings
    const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate monthly earnings (current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEarnings = payments
      .filter(payment => new Date(payment.createdAt) >= firstDayOfMonth)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate pending payments
    const pendingPayments = payments
      .filter(payment => payment.status === 'PENDING')
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate available balance (completed payments)
    const availableBalance = payments
      .filter(payment => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + payment.amount, 0);

    res.json({
      totalEarnings,
      monthlyEarnings,
      pendingPayments,
      availableBalance
    });
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    res.status(500).json({ error: 'Failed to fetch earnings summary' });
  }
});

// Get earnings transactions
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 10, offset = 0 } = req.query;

    if (userRole !== 'FREELANCER') {
      return res.status(403).json({ error: 'Only freelancers can access earnings' });
    }

    const payments = await prisma.payment.findMany({
      where: {
        freelancerId: userId
      },
      include: {
        job: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const transactions = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      type: payment.type,
      status: payment.status,
      description: payment.job ? `Payment for job: ${payment.job.title}` : 'Payment',
      createdAt: payment.createdAt
    }));

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching earnings transactions:', error);
    res.status(500).json({ error: 'Failed to fetch earnings transactions' });
  }
});

// Get earnings report
router.get('/report', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { format = 'pdf', startDate, endDate } = req.query;

    if (userRole !== 'FREELANCER') {
      return res.status(403).json({ error: 'Only freelancers can access earnings' });
    }

    // In a real application, this would generate a PDF report
    // For now, we'll just return a simple JSON response
    const payments = await prisma.payment.findMany({
      where: {
        freelancerId: userId,
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined
        }
      },
      include: {
        job: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // For PDF format, we would generate a PDF here
    // For now, just return the data
    res.json({
      format,
      payments,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating earnings report:', error);
    res.status(500).json({ error: 'Failed to generate earnings report' });
  }
});

module.exports = router; 