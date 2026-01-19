# 🎯 QUICK START - Run Demo Now!

## ⚡ Fastest Way to Run the Demo

```bash
# One command to rule them all!
./run-demo.sh
```

This will:
- ✅ Auto-install dependencies
- ✅ Configure environment  
- ✅ Start backend (port 3000)
- ✅ Start frontend (port 5173)
- ✅ Open your browser automatically

---

## 📋 What's Configured

### ✅ ALL APIs Are Ready!

| Service | Status | Purpose |
|---------|--------|---------|
| Gemini AI | ✅ | Drug recognition & AI insights |
| LiveKit | ✅ | Real-time video scanning |
| News API | ✅ | Health news integration |
| WoodWide | ✅ | ML predictions |
| Supabase | ⚠️ | Database (see below) |

---

## 🔐 About Supabase

### Option A: Use Mock Data (Recommended for Quick Demo) 🚀

**Nothing to do!** The app automatically uses demo data if Supabase isn't configured.

Just run `./run-demo.sh` and you're good to go!

### Option B: Connect to Live Database 🗄️

**If you want real database persistence:**

1. Go to: https://supabase.com/dashboard/project/nvbjeseldwocmssostbo/settings/api
2. Copy your "anon public" key
3. Update `express_backend/development.env`:
   ```env
   SUPABASE_ANON_KEY=your_actual_key_here
   ```
4. Test: `cd express_backend && node test-connection.js`
5. Load data: `node load-demo-data.js`

**Full guide**: See `GET_SUPABASE_KEY.md`

---

## 🚀 Run the Demo (3 Methods)

### Method 1: Auto Script (Easiest) ⭐
```bash
./run-demo.sh
```

### Method 2: Manual (Two Terminals)
```bash
# Terminal 1 - Backend
cd express_backend
npm start

# Terminal 2 - Frontend
cd frontend  
npm run dev
```

### Method 3: Background Mode
```bash
cd express_backend && npm start &
cd frontend && npm run dev &
```

**Then open**: http://localhost:5173

---

## 🎨 What You'll See

### Dashboard
- Real-time inventory stats
- Usage trends chart
- AI predictions
- Low stock alerts

### Inventory View
- All medications listed
- Search & filter
- Anomaly detection
- Stock levels

### Drug Scanner
- Live camera feed (LiveKit)
- AI recognition (Gemini)
- OCR text extraction
- Auto-inventory update

### Reports
- PDF generation
- CSV export
- Analytics charts

### AI Chatbot
- Gemini-powered
- Health news insights
- Inventory questions

---

## 🧪 Test Everything Works

### 1. Test Backend
```bash
curl http://localhost:3000/health
```
Should return: `{"status":"ok",...}`

### 2. Test Frontend
Open: http://localhost:5173

Should see the MedShare dashboard

### 3. Test API Connection
```bash
curl http://localhost:3000/api/inventory
```
Should return inventory data (mock or real)

---

## 📱 Features to Demo

1. **Scan a Drug Label**
   - Click camera icon
   - Allow camera access
   - Point at medication label
   - AI recognizes and updates inventory

2. **View Low Stock Alerts**
   - Check dashboard for red alerts
   - Click to see details
   - Get restock recommendations

3. **Generate Reports**
   - Go to Reports tab
   - Select date range
   - Download PDF or CSV

4. **Ask AI Chatbot**
   - Click chat icon
   - Ask about medications
   - Get AI-powered answers

5. **Upload CSV Data**
   - Go to Inventory
   - Click "Upload CSV"
   - Select file
   - Data imports automatically

---

## 🛑 Stop the Demo

If you used `./run-demo.sh`:
```bash
# Press Ctrl+C
# Then run:
pkill -f "node.*express"
pkill -f "vite"
```

If you ran manually:
```bash
# Press Ctrl+C in each terminal
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Backend (port 3000)
lsof -i :3000 | grep LISTEN
kill -9 <PID>

# Frontend (port 5173)
lsof -i :5173 | grep LISTEN
kill -9 <PID>
```

### Dependencies Missing
```bash
# Reinstall backend
cd express_backend
rm -rf node_modules
npm install

# Reinstall frontend
cd frontend
rm -rf node_modules
npm install
```

### Supabase Connection Error
**Don't worry!** App automatically uses mock data. Everything still works.

To fix:
- Follow instructions in `GET_SUPABASE_KEY.md`
- Or just continue with mock data mode

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `run-demo.sh` | Auto-start script |
| `CONFIGURATION_COMPLETE.md` | Full config details |
| `GET_SUPABASE_KEY.md` | Database setup guide |
| `express_backend/development.env` | Backend config |
| `express_backend/test-connection.js` | Test DB connection |
| `express_backend/load-demo-data.js` | Load sample data |

---

## 🎯 Summary

### ✅ What's Done:
- All API keys configured (except Supabase anon key)
- Backend ready to run
- Frontend ready to run
- Mock data fallback enabled
- Scripts created and ready

### 🚀 What to Do:
1. Run: `./run-demo.sh`
2. Open: http://localhost:5173
3. Demo the features!

### 📝 Optional:
- Add Supabase anon key for live database
- Load demo data with `node load-demo-data.js`

---

## 🎉 You're Ready!

Everything is configured. Just run:

```bash
./run-demo.sh
```

**The demo will start automatically!** 🚀

---

**Questions?**
- Check `CONFIGURATION_COMPLETE.md` for full details
- See `GET_SUPABASE_KEY.md` for database setup
- Review `LIVE_DEMO_READY.md` for comprehensive guide
