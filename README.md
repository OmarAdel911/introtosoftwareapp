# EgSeekers - Freelance Platform

A modern freelance platform connecting clients with skilled freelancers.

## Features

- User authentication (Client/Freelancer)
- Job posting and bidding
- Real-time messaging
- Payment processing
- Dashboard analytics
- Profile management
- Search and filtering
- Notifications

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Query
- Axios

### Backend
- Node.js
- Express
- Prisma
- PostgreSQL
- JWT Authentication
- Socket.io

## Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/egseekers.git
cd egseekers
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd egseekers
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Frontend (.env)
cp .env.example .env

# Backend (.env)
cd ../backend
cp .env.example .env
```

4. Set up the database:
```bash
cd backend
npx prisma migrate dev
npm run seed
```

5. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in a new terminal)
cd egseekers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Deployment

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Import your repository on Vercel
3. Configure environment variables
4. Deploy

### Backend Deployment (Railway/Heroku)

1. Create a new project
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy

### Database Deployment (Railway/Supabase)

1. Create a new PostgreSQL database
2. Update the DATABASE_URL in your backend environment variables
3. Run migrations:
```bash
npx prisma migrate deploy
```

## Testing

```bash
# Run frontend tests
cd egseekers
npm test

# Run backend tests
cd ../backend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 