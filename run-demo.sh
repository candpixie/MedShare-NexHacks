#!/bin/bash
# MedShare Quick Start Script - Run Demo Live

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   🏥 MedShare - Live Demo Launcher    ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node -v)${NC}"

# Navigate to project root
cd "$(dirname "$0")"

echo ""
echo -e "${YELLOW}📋 Step 1: Environment Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Setup backend .env
if [ ! -f "express_backend/.env" ]; then
    if [ -f "express_backend/development.env" ]; then
        cp express_backend/development.env express_backend/.env
        echo -e "${GREEN}✓ Backend .env configured${NC}"
    fi
fi

# Setup frontend .env
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend .env..."
    cat > frontend/.env << 'EOF'
VITE_SUPABASE_URL=https://nvbjeseldwocmssostbo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Ymplc2VsZHdvY21zc29zdGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNDI0MzAsImV4cCI6MjA1MjkxODQzMH0.sb_publishable_HxnbXrGM4urDKMJxOhGMJA_KHCkar51
VITE_BACKEND_URL=http://localhost:3000
VITE_GEMINI_API_KEY=AIzaSyDVZ7L6aqVgTASnn3I7iWPskUKzTpyc2nk
VITE_LIVEKIT_URL=wss://nexhacks-vbpkc2mp.livekit.cloud
VITE_LIVEKIT_API_KEY=API3X49VgfpdiRt
VITE_LIVEKIT_API_SECRET=dZ8gdwiTg3EnsBgbiKjx8m0Q2eaBnftv1xCa5hJB7N0
EOF
    echo -e "${GREEN}✓ Frontend .env configured${NC}"
fi

echo ""
echo -e "${YELLOW}📦 Step 2: Installing Dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backend dependencies
if [ ! -d "express_backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd express_backend && npm install --silent && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

# Frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install --silent && cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Install Supabase client in frontend if missing
cd frontend
if ! grep -q "@supabase/supabase-js" package.json; then
    echo "Adding @supabase/supabase-js to frontend..."
    npm install @supabase/supabase-js --silent
    echo -e "${GREEN}✓ Supabase client added${NC}"
fi
cd ..

echo ""
echo -e "${YELLOW}🧪 Step 3: Testing Database Connection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd express_backend
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './development.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test() {
  try {
    const { data, error, count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('❌ Database Error:', error.message);
      console.log('⚠️  Note: The app will run with mock data');
      return;
    }
    console.log('✅ Database connected! Found ' + count + ' records');
  } catch (err) {
    console.log('⚠️  Database connection issue:', err.message);
    console.log('⚠️  App will run with mock data');
  }
}

test();
"
cd ..

echo ""
echo -e "${YELLOW}🚀 Step 4: Starting Services${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo -e "${GREEN}Starting backend server on port 3000...${NC}"
cd express_backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to be ready..."
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check backend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Starting frontend on port 5173...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "Waiting for frontend to be ready..."
sleep 3

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed to start. Check frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║   ✅ MedShare is now running!                         ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}🌐 Access the application:${NC}"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo ""
echo -e "${BLUE}📊 Process IDs:${NC}"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}⚠️  To stop the demo:${NC}"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or press Ctrl+C and run: pkill -f \"node.*express_backend\""
echo ""
echo -e "${GREEN}🎯 Opening browser in 3 seconds...${NC}"
sleep 3

# Try to open browser
if command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
else
    echo "Please open http://localhost:5173 in your browser"
fi

echo ""
echo -e "${GREEN}Happy demoing! 🚀${NC}"
echo ""

# Keep script running and show logs
echo "Press Ctrl+C to stop all services"
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Services stopped'; exit" INT TERM

# Follow logs
tail -f backend.log frontend.log
