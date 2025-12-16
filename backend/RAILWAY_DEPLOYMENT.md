# Railway Deployment Guide

## Environment Variables to Set in Railway

### Required Variables (Aiven MySQL):
```
DB_HOST=hazem-hazemosama2553-256a.b.aivencloud.com
DB_PORT=11706
DB_USER=avnadmin
DB_PASSWORD=YOUR_PASSWORD_FROM_AIVEN
DB_DATABASE=defaultdb
DB_SSL_CA_CERT=YOUR_SSL_CERTIFICATE_TEXT_FROM_AIVEN
NODE_ENV=production
PORT=10000
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
FRONTEND_URL=https://your-frontend-url.com
```

### How to Get Aiven Values:
1. **DB_HOST, DB_PORT, DB_USER, DB_DATABASE** - From Aiven console connection info
2. **DB_PASSWORD** - Click "Reveal" next to password in Aiven console
3. **DB_SSL_CA_CERT** - Click "Show" next to CA certificate, copy entire certificate text

### Optional Variables (if using these features):
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Deployment Steps:

1. **Connect GitHub Repository**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your backend repository

2. **Set Environment Variables**
   - Go to your service → Variables tab
   - Add all required variables above

3. **Deploy**
   - Railway will automatically build and deploy
   - Check logs for any errors

4. **Run Database Migration**
   - Go to your service → Deployments tab
   - Click on latest deployment → View Logs
   - Run: `npx prisma db push` in Railway console

## Build Process:
- Railway will run `npm ci` (install dependencies)
- Then `npx prisma generate` (generate Prisma client)
- Finally `npm start` (start the server)

## Health Check:
- Railway will check `/api/health` endpoint
- Should return 200 status with health information
