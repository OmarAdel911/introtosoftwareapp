const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// Get user's credits
router.get('/', auth, async (req, res) => {
  try {
    const credits = await prisma.credit.findMany({
      where: {
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });

    const totalActiveCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);

    res.json({
      credits,
      totalActiveCredits
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

// Add credit to user
router.post('/', auth, async (req, res) => {
  try {
    const { amount, type, description, sourceId, sourceType, expiresAt } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ error: 'Amount and type are required' });
    }

    const credit = await prisma.credit.create({
      data: {
        amount: parseFloat(amount),
        type,
        description,
        sourceId,
        sourceType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: req.user.id,
      },
    });

    res.status(201).json(credit);
  } catch (error) {
    console.error('Error creating credit:', error);
    res.status(500).json({ error: 'Failed to create credit' });
  }
});

// Use credit
router.post('/use', auth, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Get user's active credits
    const activeCredits = await prisma.credit.findMany({
      where: {
        userId: req.user.id,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: {
        createdAt: 'asc', // Use oldest credits first
      },
    });

    // Calculate total available credits
    const totalAvailable = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);

    if (totalAvailable < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Use credits
    let remainingAmount = amount;
    const usedCredits = [];

    for (const credit of activeCredits) {
      if (remainingAmount <= 0) break;

      const useAmount = Math.min(remainingAmount, credit.amount);
      remainingAmount -= useAmount;

      // Update credit
      const updatedCredit = await prisma.credit.update({
        where: { id: credit.id },
        data: {
          amount: credit.amount - useAmount,
          status: credit.amount - useAmount === 0 ? 'USED' : 'ACTIVE',
        },
      });

      usedCredits.push(updatedCredit);
    }

    // Create a record of the credit usage
    const creditUsage = await prisma.credit.create({
      data: {
        amount: -amount, // Negative amount to indicate usage
        type: 'USED',
        description: description || 'Credit usage',
        userId: req.user.id,
      },
    });

    res.json({
      usedCredits,
      creditUsage,
      remainingAmount: totalAvailable - amount,
    });
  } catch (error) {
    console.error('Error using credits:', error);
    res.status(500).json({ error: 'Failed to use credits' });
  }
});

// Get credit history
router.get('/history', auth, async (req, res) => {
  try {
    const credits = await prisma.credit.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(credits);
  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.status(500).json({ error: 'Failed to fetch credit history' });
  }
});

// Purchase connects
router.post('/purchase', auth, async (req, res) => {
  try {
    const { amount, price } = req.body;
    const userId = req.user.id;

    // Create a payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: price,
        currency: 'EGP',
        status: 'PENDING',
        type: 'CONNECT_PURCHASE',
        metadata: {
          connects: amount
        }
      }
    });

    // TODO: Integrate with payment gateway (e.g., Stripe, PayPal)
    // For now, we'll simulate a successful payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' }
    });

    // Add connects to user's account
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        connects: {
          increment: amount
        }
      }
    });

    res.json({
      success: true,
      payment: updatedPayment,
      connects: user.connects
    });
  } catch (error) {
    console.error('Error purchasing connects:', error);
    res.status(500).json({ error: 'Failed to purchase connects' });
  }
});

module.exports = router; 