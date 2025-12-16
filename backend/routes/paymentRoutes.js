const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const stripeService = require('../services/stripeService');

const prisma = new PrismaClient();

// Get user's payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        proposal: {
          include: {
            job: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Create a new payment (escrow) with Stripe
router.post('/escrow', auth, async (req, res) => {
  try {
    const { proposalId, amount } = req.body;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true }
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount,
        type: 'ESCROW',
        proposalId,
        userId: req.user.id,
        status: 'PENDING'
      }
    });

    // Convert amount to smallest unit (piastres for EGP)
    const amountInSmallestUnit = stripeService.convertToSmallestUnit(amount, 'egp');

    // Create Stripe Checkout Session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const checkoutSession = await stripeService.createCheckoutSession({
      amount: amountInSmallestUnit,
      currency: 'egp',
      customerEmail: user.email,
      successUrl: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${payment.id}`,
      cancelUrl: `${frontendUrl}/payment/cancel?payment_id=${payment.id}`,
      metadata: {
        paymentId: payment.id.toString(),
        userId: req.user.id.toString(),
        proposalId: proposalId.toString(),
        type: 'ESCROW'
      },
      description: `Escrow payment for proposal ${proposalId}`
    });

    // Update payment with Stripe session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: checkoutSession.sessionId
      }
    });

    res.status(201).json({
      ...payment,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.sessionId
    });
  } catch (error) {
    console.error('Error creating escrow payment:', error);
    res.status(500).json({ error: 'Failed to create payment', message: error.message });
  }
});

// Release payment to freelancer
router.post('/release/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        proposal: {
          include: { job: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.proposal.job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        type: 'RELEASE'
      }
    });

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to release payment' });
  }
});

// Request refund
router.post('/refund/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, amount } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        proposal: {
          include: { job: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.proposal.job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    if (!payment.transactionId) {
      return res.status(400).json({ error: 'No transaction ID found for this payment' });
    }

    // Get payment intent from Stripe
    const stripe = stripeService.getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    // Retrieve payment intent to get the actual payment intent ID
    const session = await stripe.checkout.sessions.retrieve(payment.transactionId);
    const paymentIntentId = session.payment_intent;

    // Create refund amount (if partial refund)
    const refundAmount = amount 
      ? stripeService.convertToSmallestUnit(amount, 'egp')
      : null;

    // Create refund in Stripe
    const refund = await stripeService.createRefund(paymentIntentId, refundAmount);

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        type: 'REFUND'
      }
    });

    res.json({
      ...updatedPayment,
      refundId: refund.refundId,
      refundAmount: stripeService.convertFromSmallestUnit(refund.amount, 'egp')
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund', message: error.message });
  }
});

module.exports = router; 