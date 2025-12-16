const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Service
 * Handles all Stripe payment operations in sandbox/test mode
 */

// Initialize Stripe with test mode key
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not set. Using test mode.');
    // Return a mock stripe instance for development
    return null;
  }
  return stripe;
};

/**
 * Create a Stripe Checkout Session for one-time payment
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in smallest currency unit (e.g., cents for USD, piastres for EGP)
 * @param {string} params.currency - Currency code (default: 'egp')
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.successUrl - URL to redirect after successful payment
 * @param {string} params.cancelUrl - URL to redirect after cancelled payment
 * @param {Object} params.metadata - Additional metadata to attach to the session
 * @returns {Promise<Object>} Stripe Checkout Session
 */
const createCheckoutSession = async ({
  amount,
  currency = 'egp',
  customerEmail,
  successUrl,
  cancelUrl,
  metadata = {},
  description = 'Payment'
}) => {
  try {
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      throw new Error('Stripe not configured');
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
              description: description,
            },
            unit_amount: amount, // Amount in smallest currency unit
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
      payment_intent_data: {
        metadata: metadata,
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Stripe Checkout Session creation error:', error);
    throw error;
  }
};

/**
 * Create a Payment Intent for escrow payments
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in smallest currency unit
 * @param {string} params.currency - Currency code
 * @param {string} params.customerEmail - Customer email
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Payment Intent
 */
const createPaymentIntent = async ({
  amount,
  currency = 'egp',
  customerEmail,
  metadata = {},
  description = 'Payment'
}) => {
  try {
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      throw new Error('Stripe not configured');
    }

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: amount,
      currency: currency.toLowerCase(),
      description: description,
      metadata: metadata,
      receipt_email: customerEmail,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Stripe Payment Intent creation error:', error);
    throw error;
  }
};

/**
 * Retrieve a Payment Intent
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<Object>} Payment Intent
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      throw new Error('Stripe not configured');
    }

    const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe Payment Intent retrieval error:', error);
    throw error;
  }
};

/**
 * Create a refund
 * @param {string} paymentIntentId - Payment Intent ID
 * @param {number} amount - Amount to refund (optional, full refund if not provided)
 * @returns {Promise<Object>} Refund object
 */
const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      throw new Error('Stripe not configured');
    }

    const refundParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = amount;
    }

    const refund = await stripeInstance.refunds.create(refundParams);
    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    };
  } catch (error) {
    console.error('Stripe refund creation error:', error);
    throw error;
  }
};

/**
 * Verify webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Event object
 */
const verifyWebhook = (payload, signature) => {
  try {
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      throw new Error('Stripe not configured');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set. Webhook verification skipped.');
      return JSON.parse(payload);
    }

    const event = stripeInstance.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    console.error('Stripe webhook verification error:', error);
    throw error;
  }
};

/**
 * Convert EGP amount to smallest unit (piastres)
 * Stripe expects amounts in smallest currency unit
 * EGP: 1 EGP = 100 piastres
 */
const convertToSmallestUnit = (amount, currency = 'egp') => {
  if (currency.toLowerCase() === 'egp') {
    return Math.round(amount * 100); // Convert EGP to piastres
  }
  // For other currencies, adjust as needed
  return Math.round(amount * 100); // Default: assume cents
};

/**
 * Convert smallest unit back to main currency
 */
const convertFromSmallestUnit = (amount, currency = 'egp') => {
  if (currency.toLowerCase() === 'egp') {
    return amount / 100; // Convert piastres to EGP
  }
  return amount / 100; // Default: assume cents
};

module.exports = {
  getStripe,
  createCheckoutSession,
  createPaymentIntent,
  retrievePaymentIntent,
  createRefund,
  verifyWebhook,
  convertToSmallestUnit,
  convertFromSmallestUnit,
};

