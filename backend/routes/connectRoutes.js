const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// Get available connect packages
router.get('/packages', async (req, res) => {
  try {
    const packages = await prisma.connect.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        amount: 'asc',
      },
    });

    res.json(packages);
  } catch (error) {
    console.error('Error fetching connect packages:', error);
    res.status(500).json({ error: 'Failed to fetch connect packages' });
  }
});

// Get user's connects
router.get('/', auth, async (req, res) => {
  try {
    const connects = await prisma.connect.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total active connects
    const totalActiveConnects = connects
      .filter(connect => connect.isActive)
      .reduce((sum, connect) => sum + connect.amount, 0);

    res.json({
      connects,
      totalActiveConnects,
    });
  } catch (error) {
    console.error('Error fetching connects:', error);
    res.status(500).json({ error: 'Failed to fetch connects' });
  }
});

// Purchase connects
router.post('/purchase', auth, async (req, res) => {
  try {
    const { packageId, paymentMethod } = req.body;

    if (!packageId || !paymentMethod) {
      return res.status(400).json({ error: 'Package ID and payment method are required' });
    }

    // Get the connect package
    const connectPackage = await prisma.connect.findUnique({
      where: { id: packageId },
    });

    if (!connectPackage || !connectPackage.isActive) {
      return res.status(404).json({ error: 'Connect package not found or inactive' });
    }

    // Create a connect transaction
    const transaction = await prisma.connectTransaction.create({
      data: {
        amount: connectPackage.amount,
        price: connectPackage.price,
        paymentMethod,
        userId: req.user.id,
      },
    });

    // In a real application, you would integrate with a payment gateway here
    // For now, we'll simulate a successful payment
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      // Update transaction status
      await prisma.connectTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          transactionId: `txn_${Date.now()}`,
        },
      });

      // Add connects to user
      await prisma.connect.create({
        data: {
          amount: connectPackage.amount,
          price: connectPackage.price,
          description: `Purchased ${connectPackage.amount} connects`,
          userId: req.user.id,
        },
      });

      res.json({
        success: true,
        message: `Successfully purchased ${connectPackage.amount} connects`,
        transaction,
      });
    } else {
      // Update transaction status to failed
      await prisma.connectTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
        },
      });

      res.status(400).json({
        success: false,
        message: 'Payment failed',
        transaction,
      });
    }
  } catch (error) {
    console.error('Error purchasing connects:', error);
    res.status(500).json({ error: 'Failed to purchase connects' });
  }
});

// Use connects for job application
router.post('/use', auth, async (req, res) => {
  try {
    const { jobId, amount } = req.body;

    if (!jobId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Job ID and valid amount are required' });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is a freelancer
    if (req.user.role !== 'FREELANCER') {
      return res.status(403).json({ error: 'Only freelancers can use connects' });
    }

    // Check if user already submitted a proposal for this job
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        jobId: jobId,
        freelancerId: req.user.id
      }
    });
    
    if (existingProposal) {
      return res.status(400).json({ error: 'You have already submitted a proposal for this job' });
    }

    // Get user's active connects
    const activeConnects = await prisma.connect.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc', // Use oldest connects first
      },
    });

    // Calculate total available connects
    const totalAvailable = activeConnects.reduce((sum, connect) => sum + connect.amount, 0);

    if (totalAvailable < amount) {
      return res.status(400).json({ error: 'Insufficient connects' });
    }

    // Use connects
    let remainingAmount = amount;
    const usedConnects = [];

    for (const connect of activeConnects) {
      if (remainingAmount <= 0) break;

      const useAmount = Math.min(remainingAmount, connect.amount);
      remainingAmount -= useAmount;

      // Update connect
      const updatedConnect = await prisma.connect.update({
        where: { id: connect.id },
        data: {
          amount: connect.amount - useAmount,
          isActive: connect.amount - useAmount > 0,
        },
      });

      usedConnects.push(updatedConnect);
    }

    // Create a proposal for the job
    const proposal = await prisma.proposal.create({
      data: {
        coverLetter: 'Applied using connects',
        amount: job.budget,
        jobId,
        freelancerId: req.user.id,
        status: 'PENDING'
      },
    });

    res.json({
      success: true,
      message: `Successfully applied to job with ${amount} connects`,
      usedConnects,
      proposal,
      remainingConnects: totalAvailable - amount,
    });
  } catch (error) {
    console.error('Error using connects:', error);
    res.status(500).json({ error: 'Failed to use connects' });
  }
});

// Get connect transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await prisma.connectTransaction.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching connect transactions:', error);
    res.status(500).json({ error: 'Failed to fetch connect transactions' });
  }
});

module.exports = router; 