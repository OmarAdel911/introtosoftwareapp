# Stripe Sandbox Quick Start

## Quick Setup (5 minutes)

### 1. Get Stripe Test Keys

1. Sign up at https://stripe.com (free)
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy **Secret key** (starts with `sk_test_`)

### 2. Add to `.env`

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
FRONTEND_URL=http://localhost:3000
```

### 3. Test Payment

1. Start backend: `npm run dev`
2. Go to `/freelancer/connects`
3. Click "Purchase" on any package
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. ✅ Done!

## Test Cards

**Success**: `4242 4242 4242 4242`  
**Decline**: `4000 0000 0000 0002`  
**3D Secure**: `4000 0025 0000 3155`

Use any future expiry, any CVC, any ZIP.

## What's Integrated

✅ Connect purchases  
✅ Escrow payments  
✅ Payment verification  
✅ Refunds  
✅ Webhooks (optional for local testing)

## Files Created

- `backend/services/stripeService.js` - Stripe service
- `backend/routes/stripeWebhookRoutes.js` - Webhook handler
- `egseekers/.../app/payment/success/page.tsx` - Success page
- `egseekers/.../app/payment/cancel/page.tsx` - Cancel page

## Next Steps

See `STRIPE_SANDBOX_SETUP.md` for detailed documentation.

