const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const stripeService = require('../services/stripeService');

const prisma = new PrismaClient();

// Stripe webhook endpoint (must be before body parsing middleware)
// This route should be mounted before express.json() middleware
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // req.body is a Buffer when using express.raw()
    const payload = req.body.toString();
    event = stripeService.verifyWebhook(payload, sig);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  try {
    const metadata = session.metadata;
    
    if (metadata.type === 'CONNECT_PURCHASE') {
      const transactionId = parseInt(metadata.transactionId);
      const userId = parseInt(metadata.userId);
      const connects = parseInt(metadata.connects);

      // Update transaction status
      const transaction = await prisma.connectTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          transactionId: session.payment_intent || session.id
        }
      });

      // Add connects to user's account
      await prisma.connect.create({
        data: {
          amount: connects,
          price: transaction.price,
          description: `Purchased ${connects} connects`,
          userId: userId,
          isActive: true
        }
      });

      console.log(`✅ Connect purchase completed: Transaction ${transactionId}, User ${userId}, ${connects} connects`);
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const metadata = paymentIntent.metadata;
    
    if (metadata.type === 'ESCROW') {
      const paymentId = parseInt(metadata.paymentId);
      
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          transactionId: paymentIntent.id
        }
      });

      console.log(`✅ Escrow payment completed: Payment ${paymentId}`);
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

// Handle failed payment intent
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const metadata = paymentIntent.metadata;
    
    if (metadata.type === 'CONNECT_PURCHASE') {
      const transactionId = parseInt(metadata.transactionId);
      
      await prisma.connectTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED'
        }
      });

      console.log(`❌ Connect purchase failed: Transaction ${transactionId}`);
    } else if (metadata.type === 'ESCROW') {
      const paymentId = parseInt(metadata.paymentId);
      
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          transactionId: paymentIntent.id
        }
      });

      console.log(`❌ Escrow payment failed: Payment ${paymentId}`);
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
}

// Handle refund
async function handleChargeRefunded(charge) {
  try {
    const paymentIntentId = charge.payment_intent;
    
    // Find payment by transaction ID
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: paymentIntentId
      }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED'
        }
      });

      console.log(`✅ Refund processed: Payment ${payment.id}`);
    }
  } catch (error) {
    console.error('Error handling charge refunded:', error);
    throw error;
  }
}

module.exports = router;

