# Stripe Sandbox Integration Guide

## Overview

This guide explains how to set up and use Stripe sandbox/test mode for payments in the EGSeekers application.

## Features

✅ **Stripe Checkout** - Secure payment processing  
✅ **Sandbox Mode** - Test payments without real charges  
✅ **Webhook Support** - Automatic payment verification  
✅ **Connect Purchases** - Buy connects with Stripe  
✅ **Escrow Payments** - Secure escrow for job payments  
✅ **Refunds** - Full and partial refund support  

## Setup Instructions

### Step 1: Get Stripe Test Keys

1. **Sign up for Stripe** (if you don't have an account)
   - Go to: https://stripe.com
   - Create a free account

2. **Get Test API Keys**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

3. **Get Webhook Secret** (for local testing)
   - Install Stripe CLI: https://stripe.com/docs/stripe-cli
   - Run: `stripe listen --forward-to localhost:5001/api/stripe/webhook`
   - Copy the webhook signing secret (starts with `whsec_`)

### Step 2: Configure Environment Variables

Add to `backend/.env`:

```env
# Stripe Configuration (Sandbox/Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000
```

### Step 3: Test the Integration

#### Test Connect Purchase

1. Go to `/freelancer/connects`
2. Select a package
3. Click "Purchase"
4. You'll be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
6. Use any future expiry date (e.g., `12/34`)
7. Use any 3-digit CVC (e.g., `123`)
8. Use any ZIP code (e.g., `12345`)
9. Complete payment
10. You'll be redirected back to success page

#### Test Escrow Payment

1. Create a job and proposal
2. Go to proposal details
3. Click "Pay Escrow"
4. Follow Stripe Checkout flow
5. Use test card above
6. Payment will be held in escrow

## Test Cards

### Successful Payment
- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

### Declined Payment
- **Card**: `4000 0000 0000 0002`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

### Requires Authentication (3D Secure)
- **Card**: `4000 0025 0000 3155`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

More test cards: https://stripe.com/docs/testing

## API Endpoints

### Connect Purchase

**Create Checkout Session:**
```
POST /api/connect-purchase/create-checkout
Body: { packageId: 1 }
Response: { checkoutUrl: "...", sessionId: "..." }
```

**Verify Payment:**
```
POST /api/connect-purchase/verify-payment
Body: { sessionId: "...", transactionId: "..." }
Response: { success: true, transaction: {...}, connects: {...} }
```

### Escrow Payment

**Create Escrow:**
```
POST /api/payments/escrow
Body: { proposalId: "...", amount: 1000 }
Response: { checkoutUrl: "...", sessionId: "..." }
```

**Refund:**
```
POST /api/payments/refund/:paymentId
Body: { amount: 500 } // Optional, full refund if omitted
Response: { refundId: "...", refundAmount: 500 }
```

### Webhook

**Stripe Webhook:**
```
POST /api/stripe/webhook
Headers: { stripe-signature: "..." }
Body: Raw Stripe event payload
```

## Webhook Setup

### Local Development

1. **Install Stripe CLI**
   ```bash
   brew install stripe/stripe-cli/stripe
   # or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**
   ```bash
   stripe listen --forward-to localhost:5001/api/stripe/webhook
   ```

4. **Copy webhook secret** (starts with `whsec_`)
   - Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy webhook signing secret
6. Add to production environment variables

## Currency Handling

The integration uses **EGP (Egyptian Pound)**:
- Amounts are stored in EGP (e.g., 100 EGP)
- Stripe expects amounts in **piastres** (smallest unit)
- Conversion: 1 EGP = 100 piastres
- Example: 100 EGP → 10000 piastres

The service automatically handles conversion:
- `convertToSmallestUnit(100, 'egp')` → `10000`
- `convertFromSmallestUnit(10000, 'egp')` → `100`

## Payment Flow

### Connect Purchase Flow

1. User selects package → Frontend calls `/create-checkout`
2. Backend creates Stripe Checkout Session
3. User redirected to Stripe Checkout
4. User completes payment
5. Stripe redirects to `/payment/success`
6. Frontend calls `/verify-payment`
7. Backend verifies payment and adds connects
8. Webhook also processes payment (backup)

### Escrow Payment Flow

1. Client creates escrow payment → Frontend calls `/escrow`
2. Backend creates Stripe Checkout Session
3. User redirected to Stripe Checkout
4. User completes payment
5. Stripe redirects to `/payment/success`
6. Webhook processes payment and updates status
7. Payment held in escrow until release/refund

## Troubleshooting

### Issue: "Stripe not configured"
- **Solution**: Add `STRIPE_SECRET_KEY` to `.env`

### Issue: Webhook verification fails
- **Solution**: Ensure `STRIPE_WEBHOOK_SECRET` is correct
- **Solution**: Ensure webhook endpoint receives raw body (not JSON parsed)

### Issue: Payment succeeds but connects not added
- **Solution**: Check webhook is receiving events
- **Solution**: Check backend logs for webhook processing
- **Solution**: Manually verify payment via `/verify-payment` endpoint

### Issue: Test card not working
- **Solution**: Ensure you're using test keys (not live keys)
- **Solution**: Use correct test card numbers
- **Solution**: Check Stripe Dashboard → Logs for errors

## Security Notes

⚠️ **Important**:
- Never commit Stripe keys to git
- Use environment variables for all keys
- Test keys start with `pk_test_` and `sk_test_`
- Live keys start with `pk_live_` and `sk_live_`
- Always verify webhook signatures in production
- Use HTTPS in production

## Testing Checklist

- [ ] Stripe keys configured in `.env`
- [ ] Webhook secret configured
- [ ] Test connect purchase flow
- [ ] Test escrow payment flow
- [ ] Test payment success redirect
- [ ] Test payment cancel redirect
- [ ] Test refund flow
- [ ] Verify webhook events are received
- [ ] Check database transactions are created
- [ ] Verify connects are added after payment

## Next Steps

1. **Test all payment flows** with test cards
2. **Set up webhook endpoint** for production
3. **Configure production Stripe keys** when ready
4. **Test refund functionality**
5. **Monitor Stripe Dashboard** for transactions

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe Support: https://support.stripe.com

