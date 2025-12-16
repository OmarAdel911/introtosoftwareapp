#!/bin/bash

# Script to start both backend and frontend servers

echo "🚀 Starting EgSeekers Application..."
echo ""

# Kill any existing processes
echo "📦 Clearing ports..."
lsof -ti:5001,3000 | xargs kill -9 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start backend
echo "🔧 Starting Backend on port 5001..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:5001"
else
    echo "❌ Backend failed to start. Check backend.log for errors"
    exit 1
fi

# Start frontend
echo "🎨 Starting Frontend on port 3000..."
cd egseekers/egseekersfrontend-main
PORT=3000 npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait for frontend to start
sleep 8

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "⚠️  Frontend may still be starting. Check frontend.log for errors"
fi

echo ""
echo "📊 Server Status:"
echo "   Backend:  http://localhost:5001"
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:5001/api"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or: lsof -ti:5001,3000 | xargs kill -9"

