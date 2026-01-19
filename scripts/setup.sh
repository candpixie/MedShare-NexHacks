#!/bin/bash
# MedShare Setup Script - Environment Configuration & Connection Test

set -e

echo "🚀 MedShare Setup - Configuring Environment & Testing Connections"
echo "================================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

echo ""
echo "📦 Step 1: Installing Dependencies"
echo "-----------------------------------"

# Install backend dependencies
echo "Installing backend dependencies..."
cd express_backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✓ Backend dependencies already installed"
fi
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✓ Frontend dependencies already installed"
fi

# Install Supabase client if not present
echo "Checking for @supabase/supabase-js..."
if ! grep -q "@supabase/supabase-js" package.json; then
    echo "Installing @supabase/supabase-js..."
    npm install @supabase/supabase-js
else
    echo "✓ @supabase/supabase-js already installed"
fi

cd ..

echo ""
echo "📝 Step 2: Environment Configuration"
echo "-------------------------------------"

# Check backend .env
if [ ! -f "express_backend/.env" ]; then
    if [ -f "express_backend/development.env" ]; then
        echo "Copying development.env to .env..."
        cp express_backend/development.env express_backend/.env
        echo -e "${GREEN}✓ Backend .env created${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: No backend environment file found${NC}"
    fi
else
    echo "✓ Backend .env exists"
fi

# Check frontend .env
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend .env file..."
    cat > frontend/.env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://nvbjeseldwocmssostbo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Ymplc2VsZHdvY21zc29zdGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNDI0MzAsImV4cCI6MjA1MjkxODQzMH0.sb_publishable_HxnbXrGM4urDKMJxOhGMJA_KHCkar51

# Backend API
VITE_BACKEND_URL=http://localhost:3000

# Gemini API
VITE_GEMINI_API_KEY=AIzaSyDVZ7L6aqVgTASnn3I7iWPskUKzTpyc2nk

# LiveKit Configuration
VITE_LIVEKIT_URL=wss://nexhacks-vbpkc2mp.livekit.cloud
VITE_LIVEKIT_API_KEY=API3X49VgfpdiRt
VITE_LIVEKIT_API_SECRET=dZ8gdwiTg3EnsBgbiKjx8m0Q2eaBnftv1xCa5hJB7N0
EOF
    echo -e "${GREEN}✓ Frontend .env created${NC}"
else
    echo "✓ Frontend .env exists"
fi

echo ""
echo "🧪 Step 3: Testing Connections"
echo "-------------------------------"

# Test Supabase connection
echo "Testing Supabase connection..."
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
    const { data, error } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase Error:', error.message);
      process.exit(1);
    }
    console.log('✅ Supabase connected successfully!');
    if (data && data.length > 0) {
      console.log('✓ Found', data.length, 'record(s) in inventory table');
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

test();
" || echo -e "${RED}❌ Supabase connection failed${NC}"

cd ..

echo ""
echo "✅ Setup Complete!"
echo "===================="
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Start the backend server:"
echo -e "   ${GREEN}cd express_backend && npm start${NC}"
echo ""
echo "2. In a new terminal, start the frontend:"
echo -e "   ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo "3. Open your browser to:"
echo -e "   ${GREEN}http://localhost:5173${NC}"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: ./docs/QUICK_START_GUIDE.md"
echo "   - API Reference: ./express_backend/README.md"
echo ""
echo "🔧 Environment Variables:"
echo "   - Backend: ./express_backend/development.env"
echo "   - Frontend: ./frontend/.env"
echo ""
echo "Happy coding! 🚀"
