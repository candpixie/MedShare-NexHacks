# 🚀 MedShare Live Demo - Quick Start

## ✅ Environment Configuration Complete

All API keys and database connections are now properly configured:

### 🔑 Configured Services

- **Supabase Database**: Connected ✅
  - URL: `https://nvbjeseldwocmssostbo.supabase.co`
  - Live inventory data storage
  
- **Gemini AI**: Configured ✅
  - Enhanced drug recognition
  - AI-powered insights
  
- **LiveKit**: Configured ✅
  - Real-time video streaming
  - Drug label scanning
  
- **News API**: Configured ✅
  - Health news and alerts
  
- **WoodWide API**: Configured ✅
  - ML predictions and forecasting

---

## 🎯 Three Ways to Run the Demo

### Option 1: Quick Start (Automated) 🚀

```bash
# One-command demo launch
./run-demo.sh
```

This will:
1. ✅ Install all dependencies
2. ✅ Configure environment variables
3. ✅ Test database connection
4. ✅ Start backend (port 3000)
5. ✅ Start frontend (port 5173)
6. ✅ Open browser automatically

### Option 2: Manual Setup 🔧

```bash
# 1. Install dependencies
cd express_backend && npm install && cd ..
cd frontend && npm install && npm install @supabase/supabase-js && cd ..

# 2. Start backend (Terminal 1)
cd express_backend
npm start

# 3. Start frontend (Terminal 2)
cd frontend
npm run dev
```

Then open: http://localhost:5173

### Option 3: Load Demo Data 📦

If your database is empty, load sample data:

```bash
# Navigate to backend folder
cd express_backend

# Load demo inventory data
node load-demo-data.js

# Or clear existing and reload
node load-demo-data.js --clear
```

---

## 🧪 Testing the Connection

### Test Supabase Connection

```bash
cd express_backend

# Test database connectivity
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './development.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test() {
  const { data, error, count } = await supabase
    .from('inventory')
    .select('*', { count: 'exact' })
    .limit(1);
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  console.log('✅ Connected! Found', count, 'records');
  console.log('Sample:', data);
}

test();
"
```

### Test Backend API

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test inventory endpoint
curl http://localhost:3000/api/inventory
```

---

## 📋 Environment Files

### Backend (.env or development.env)
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://nvbjeseldwocmssostbo.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...KHCkar51

NEWS_API_KEY=9c712e4821a94b5aab15929ce33eee68
GEMINI_API_KEY=AIzaSyDVZ7L6aqVgTASnn3I7iWPskUKzTpyc2nk
WOODWIDE_API_KEY=sk_0iflTY1yeLpobTrTFrPdWjau6V29bfBQoSw0GgZMeno

LIVEKIT_URL=wss://nexhacks-vbpkc2mp.livekit.cloud
LIVEKIT_API_KEY=API3X49VgfpdiRt
LIVEKIT_API_SECRET=dZ8gdwiTg3EnsBgbiKjx8m0Q2eaBnftv1xCa5hJB7N0
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://nvbjeseldwocmssostbo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...KHCkar51
VITE_BACKEND_URL=http://localhost:3000
VITE_GEMINI_API_KEY=AIzaSyDVZ7L6aqVgTASnn3I7iWPskUKzTpyc2nk
VITE_LIVEKIT_URL=wss://nexhacks-vbpkc2mp.livekit.cloud
VITE_LIVEKIT_API_KEY=API3X49VgfpdiRt
VITE_LIVEKIT_API_SECRET=dZ8gdwiTg3EnsBgbiKjx8m0Q2eaBnftv1xCa5hJB7N0
```

---

## 🎨 Demo Features

### 1. **Dashboard** 📊
- Real-time inventory statistics
- Usage trends visualization
- AI-powered forecasting

### 2. **Inventory Management** 📦
- View all medications
- Low stock alerts
- Anomaly detection
- Search and filter

### 3. **Drug Scanning** 📸
- LiveKit video streaming
- Gemini AI recognition
- OCR + AI analysis
- Automatic inventory updates

### 4. **Reports** 📈
- Generate PDF reports
- CSV export
- Usage analytics
- Expiry tracking

### 5. **AI Chatbot** 💬
- Health news insights
- Inventory questions
- Gemini-powered responses

---

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Check logs
cd express_backend
npm start
```

### Frontend won't start
```bash
# Check if port 5173 is in use
lsof -i :5173

# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database connection issues
```bash
# Verify environment variables
cd express_backend
cat development.env

# Test connection
node -e "require('dotenv').config({path:'./development.env'}); console.log(process.env.SUPABASE_URL)"
```

### Missing dependencies
```bash
# Reinstall all dependencies
cd express_backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## 📚 API Documentation

### Inventory Endpoints

```bash
GET    /api/inventory                    # Get all items
GET    /api/inventory/stats               # Get statistics
GET    /api/inventory/low-stock          # Get low stock items
GET    /api/inventory/anomalies          # Get anomalies
GET    /api/inventory/restock-recommendations  # Get restock recs
POST   /api/inventory                    # Create item
PUT    /api/inventory/:id                # Update item
DELETE /api/inventory/:id                # Delete item
POST   /api/inventory/upload-csv         # Upload CSV
```

### Other Endpoints

```bash
GET    /news/health-inventory-analysis   # AI news insights
POST   /news/chat                        # Chatbot
GET    /api/settings/profile             # User profile
GET    /health                           # Health check
```

---

## 🎯 Demo Workflow

1. **Start the app** using `./run-demo.sh`
2. **View Dashboard** - See inventory overview
3. **Check Inventory** - Browse medications, see low stock alerts
4. **Scan Drugs** - Use camera to scan medication labels (LiveKit + Gemini AI)
5. **Generate Reports** - Create PDF/CSV reports
6. **Ask Chatbot** - Get insights from AI assistant

---

## 🛠️ Technology Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini AI
- **Video**: LiveKit
- **OCR**: Tesseract.js

---

## ✅ Verification Checklist

- [x] Environment variables configured
- [x] Supabase connection established
- [x] Gemini AI key configured
- [x] LiveKit credentials set
- [x] Backend dependencies installed
- [x] Frontend dependencies installed
- [x] Demo data loaded (optional)
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Browser opens to http://localhost:5173

---

## 🎉 Ready to Demo!

Everything is configured and ready to go. Run:

```bash
./run-demo.sh
```

**Or manually:**

```bash
# Terminal 1
cd express_backend && npm start

# Terminal 2  
cd frontend && npm run dev
```

Then open: **http://localhost:5173**

---

## 📞 Support

If you encounter any issues:

1. Check the logs: `backend.log` and `frontend.log`
2. Verify environment variables are set
3. Ensure all dependencies are installed
4. Check that ports 3000 and 5173 are available

**All services are configured and ready for live demo! 🚀**
