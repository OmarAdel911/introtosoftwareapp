const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const stripeService = require('../services/stripeService');

const prisma = new PrismaClient();

// Get available credit packages
router.get('/packages', async (req, res) => {
  try {
    const packages = [
      {
        id: 1,
        name: "Starter",
        credits: 500,
        price: 500,
        description: "Perfect for small projects",
        features: [
          "500 EGP Credits",
          "Valid indefinitely",
          "Basic support",
          "Standard processing time"
        ]
      },
      {
        id: 2,
        name: "Professional",
        credits: 2000,
        price: 1900,
        description: "Best for regular clients",
        features: [
          "2000 EGP Credits",
          "Valid indefinitely",
          "Priority support",
          "Faster processing time",
          "5% savings"
        ]
      },
      {
        id: 3,
        name: "Enterprise",
        credits: 5000,
        price: 4500,
        description: "For large projects and agencies",
        features: [
          "5000 EGP Credits",
          "Valid indefinitely",
          "24/7 Premium support",
          "Instant processing",
          "10% savings"
        ]
      }
    ];

    res.json(packages);
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    res.status(500).json({ error: 'Failed to fetch credit packages' });
  }
});

// Create Stripe Checkout Session for credit purchase
router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.id;

    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' });
    }

    // Convert packageId to number if it's a string
    const packageIdNum = typeof packageId === 'string' ? parseInt(packageId, 10) : packageId;
    
    if (isNaN(packageIdNum) || packageIdNum < 1 || packageIdNum > 3) {
      return res.status(400).json({ 
        error: 'Invalid package ID',
        message: `Package ID must be 1, 2, or 3. Received: ${packageId}`
      });
    }

    // Get the package details
    const packages = [
      { id: 1, credits: 500, price: 500 },
      { id: 2, credits: 2000, price: 1900 },
      { id: 3, credits: 5000, price: 4500 }
    ];

    const selectedPackage = packages.find(p => p.id === packageIdNum);
    if (!selectedPackage) {
      return res.status(400).json({ 
        error: 'Invalid package selected',
        message: `Package ID ${packageId} not found. Available: 1, 2, 3`
      });
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user is a client
    if (user.role !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can purchase credits' });
    }

    // Create a temporary credit record to track the pending purchase
    // We'll delete this and create a proper one after payment confirmation
    const transaction = await prisma.credit.create({
      data: {
        userId: userId,
        amount: 0, // Will be updated after payment
        type: 'PURCHASED',
        status: 'ACTIVE',
        description: `Pending purchase of ${selectedPackage.credits} EGP credits (Package ${packageIdNum})`,
        sourceType: 'CREDIT_PURCHASE_PENDING'
      }
    });

    // Convert price to smallest unit (piastres for EGP)
    const amountInSmallestUnit = stripeService.convertToSmallestUnit(selectedPackage.price, 'egp');

    // Create Stripe Checkout Session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const checkoutSession = await stripeService.createCheckoutSession({
      amount: amountInSmallestUnit,
      currency: 'egp',
      customerEmail: user.email,
      successUrl: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&creditTransactionId=${transaction.id}&type=credit`,
      cancelUrl: `${frontendUrl}/payment/cancel?creditTransactionId=${transaction.id}`,
      metadata: {
        creditTransactionId: transaction.id.toString(),
        userId: userId.toString(),
        packageId: packageIdNum.toString(),
        credits: selectedPackage.credits.toString(),
        price: selectedPackage.price.toString(),
        type: 'CREDIT_PURCHASE'
      },
      description: `Purchase ${selectedPackage.credits} EGP Credits`
    });

    // Update credit record with Stripe session ID in sourceId
    await prisma.credit.update({
      where: { id: transaction.id },
      data: {
        sourceId: checkoutSession.sessionId
      }
    });

    res.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.sessionId,
      creditTransactionId: transaction.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Verify payment and complete transaction (called after successful payment)
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { sessionId, creditTransactionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the checkout session from Stripe
    const stripe = stripeService.getStripe();
    if (!stripe) {
      console.error('Stripe not configured - STRIPE_SECRET_KEY missing');
      return res.status(503).json({ 
        error: 'Stripe not configured',
        message: 'Please configure STRIPE_SECRET_KEY in environment variables'
      });
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      console.error('Stripe session retrieval error:', stripeError);
      return res.status(400).json({ 
        error: 'Invalid session ID',
        message: stripeError.message || 'Failed to retrieve session from Stripe'
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        paymentStatus: session.payment_status
      });
    }

    // Find credit transaction record
    let creditTransaction;
    try {
      if (creditTransactionId) {
        creditTransaction = await prisma.credit.findUnique({
          where: { id: creditTransactionId }
        });
      } else {
        // Try to find by session ID if creditTransactionId not provided
        creditTransaction = await prisma.credit.findFirst({
          where: { 
            sourceId: sessionId,
            sourceType: 'CREDIT_PURCHASE_PENDING'
          }
        });
      }
    } catch (dbError) {
      console.error('Database error finding credit transaction:', dbError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to find credit transaction',
        details: dbError.message
      });
    }

    if (!creditTransaction) {
      return res.status(404).json({ 
        error: 'Credit transaction not found',
        message: 'Credit transaction not found in database. Payment may have been processed via webhook.'
      });
    }

    if (creditTransaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get credits amount from metadata
    const metadata = session.metadata || {};
    const creditsAmount = parseFloat(metadata.credits || '0');

    if (creditsAmount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid credits amount',
        message: 'Could not determine credits amount from payment metadata'
      });
    }

    // Check if credits were already added (in case webhook processed it)
    // Look for any credit with the same payment intent or session ID
    const existingCredits = await prisma.credit.findFirst({
      where: {
        userId: userId,
        sourceId: session.payment_intent || sessionId,
        sourceType: 'CREDIT_PURCHASE',
        amount: creditsAmount,
        createdAt: {
          gte: new Date(Date.now() - 300000) // Within last 5 minutes
        }
      }
    });

    if (existingCredits) {
      // Credits already added, likely by webhook
      // Delete the pending transaction record if it still exists
      if (creditTransaction.sourceType === 'CREDIT_PURCHASE_PENDING') {
        await prisma.credit.delete({
          where: { id: creditTransaction.id }
        }).catch(() => {}); // Ignore if already deleted
      }

      return res.json({
        success: true,
        message: 'Payment already processed',
        credits: existingCredits
      });
    }

    // Update the pending credit transaction with actual credits
    const updatedCredit = await prisma.credit.update({
      where: { id: creditTransaction.id },
      data: {
        amount: creditsAmount,
        description: `Purchased ${creditsAmount} EGP credits`,
        sourceId: session.payment_intent || sessionId,
        sourceType: 'CREDIT_PURCHASE',
        status: 'ACTIVE',
        type: 'PURCHASED'
      }
    });

    console.log(`✅ Credit purchase verified: Transaction ${creditTransaction.id}, User ${userId}, ${creditsAmount} EGP credits`);

    res.json({
      success: true,
      credits: updatedCredit
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      message: error.message || 'An unexpected error occurred',
      details: error.stack
    });
  }
});

module.exports = router;

