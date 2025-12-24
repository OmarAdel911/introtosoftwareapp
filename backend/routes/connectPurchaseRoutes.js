const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const stripeService = require('../services/stripeService');

const prisma = new PrismaClient();

// Get available connect packages
router.get('/packages', async (req, res) => {
  try {
    const packages = [
      {
        id: 1,
        name: "Starter",
        connects: 10,
        price: 100,
        description: "Perfect for getting started",
        features: [
          "10 Connects",
          "Valid for 6 months",
          "Basic support",
          "Standard processing time"
        ]
      },
      {
        id: 2,
        name: "Professional",
        connects: 40,
        price: 350,
        description: "Best for regular job seekers",
        features: [
          "40 Connects",
          "Valid for 6 months",
          "Priority support",
          "Faster processing time",
          "20% savings"
        ]
      },
      {
        id: 3,
        name: "Enterprise",
        connects: 80,
        price: 600,
        description: "For power users",
        features: [
          "80 Connects",
          "Valid for 6 months",
          "24/7 Premium support",
          "Instant processing",
          "30% savings"
        ]
      }
    ];

    res.json(packages);
  } catch (error) {
    console.error('Error fetching connect packages:', error);
    res.status(500).json({ error: 'Failed to fetch connect packages' });
  }
});

// Create Stripe Checkout Session for connect purchase
router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.id;

    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' });
    }

    // Try to get package from database first (if packageId looks like a database ID)
    let selectedPackage = null;
    
    // Check if packageId looks like a UUID or database ID (not a simple number)
    const isDatabaseId = typeof packageId === 'string' && packageId.length > 10;
    
    if (isDatabaseId) {
      try {
        const dbPackage = await prisma.connect.findUnique({
          where: { id: packageId }
        });
        
        if (dbPackage && dbPackage.isActive) {
          selectedPackage = {
            id: dbPackage.id,
            connects: dbPackage.amount,
            price: dbPackage.price
          };
        }
      } catch (dbError) {
        console.log('Package not found in database, trying hardcoded packages:', dbError.message);
      }
    }

    // Fallback to hardcoded packages if not found in database
    if (!selectedPackage) {
      // Convert packageId to number if it's a string
      const packageIdNum = typeof packageId === 'string' ? parseInt(packageId, 10) : packageId;
      
      if (isNaN(packageIdNum) || packageIdNum < 1 || packageIdNum > 3) {
        return res.status(400).json({ 
          error: 'Invalid package ID',
          message: `Package ID must be 1, 2, or 3. Received: ${packageId}`
        });
      }

      // Get the package details (hardcoded fallback)
      const packages = [
        { id: 1, connects: 10, price: 100 },
        { id: 2, connects: 40, price: 350 },
        { id: 3, connects: 80, price: 600 }
      ];

      const hardcodedPackage = packages.find(p => p.id === packageIdNum);
      if (!hardcodedPackage) {
        return res.status(400).json({ 
          error: 'Invalid package selected',
          message: `Package ID ${packageId} not found. Available: 1, 2, 3`
        });
      }
      
      selectedPackage = hardcodedPackage;
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a connect transaction record
    const transaction = await prisma.connectTransaction.create({
      data: {
        amount: selectedPackage.connects,
        price: selectedPackage.price,
        status: 'PENDING',
        paymentMethod: 'stripe',
        userId: userId
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
      successUrl: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&transaction_id=${transaction.id}`,
      cancelUrl: `${frontendUrl}/payment/cancel?transaction_id=${transaction.id}`,
      metadata: {
        transactionId: transaction.id.toString(),
        userId: userId.toString(),
        packageId: packageId.toString(),
        connects: selectedPackage.connects.toString(),
        type: 'CONNECT_PURCHASE'
      },
      description: `Purchase ${selectedPackage.connects} Connects`
    });

    // Update transaction with Stripe session ID
    await prisma.connectTransaction.update({
      where: { id: transaction.id },
      data: {
        transactionId: checkoutSession.sessionId
      }
    });

    res.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.sessionId,
      transactionId: transaction.id
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
    const { sessionId, transactionId } = req.body;
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

    // Find transaction
    let transaction;
    try {
      // transactionId is the UUID of the ConnectTransaction record
      // sessionId is the Stripe checkout session ID stored in transactionId field
      if (transactionId) {
        // Try to find by transaction ID (UUID)
        transaction = await prisma.connectTransaction.findUnique({
          where: { id: transactionId }
        });
      }
      
      // If not found by ID, try to find by Stripe session ID
      if (!transaction) {
        transaction = await prisma.connectTransaction.findFirst({
          where: { transactionId: sessionId }
        });
      }
    } catch (dbError) {
      console.error('Database error finding transaction:', dbError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to find transaction',
        details: dbError.message
      });
    }

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        message: 'Transaction not found in database. Payment may have been processed via webhook.'
      });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (transaction.status === 'COMPLETED') {
      // Check if connects were already added
      const existingConnects = await prisma.connect.findFirst({
        where: {
          userId: userId,
          description: `Purchased ${transaction.amount} connects`
        }
      });

      return res.json({
        success: true,
        message: 'Payment already processed',
        transaction,
        connects: existingConnects
      });
    }

    // Update transaction status
    let updatedTransaction;
    try {
      updatedTransaction = await prisma.connectTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          transactionId: session.payment_intent || sessionId
        }
      });
    } catch (updateError) {
      console.error('Error updating transaction:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update transaction',
        message: 'Could not update transaction status',
        details: updateError.message
      });
    }

    // Add connects to user's account
    let connectRecord;
    try {
      // Check if connects were already added (in case webhook processed it)
      const existingConnects = await prisma.connect.findFirst({
        where: {
          userId: userId,
          description: `Purchased ${transaction.amount} connects`,
          createdAt: {
            gte: new Date(Date.now() - 60000) // Within last minute
          }
        }
      });

      if (existingConnects) {
        // Connects already added, likely by webhook
        return res.json({
          success: true,
          message: 'Payment already processed',
          transaction: updatedTransaction,
          connects: existingConnects
        });
      }

      connectRecord = await prisma.connect.create({
        data: {
          amount: transaction.amount,
          price: transaction.price,
          description: `Purchased ${transaction.amount} connects`,
          userId: userId,
          isActive: true
        }
      });
    } catch (createError) {
      console.error('Error creating connect record:', createError);
      // Transaction is already updated, so we should still return success
      // but log the error for investigation
      return res.status(500).json({ 
        error: 'Failed to add connects',
        message: 'Payment verified but failed to add connects to account. Please contact support.',
        details: createError.message,
        transaction: updatedTransaction
      });
    }

    res.json({
      success: true,
      transaction: updatedTransaction,
      connects: connectRecord
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