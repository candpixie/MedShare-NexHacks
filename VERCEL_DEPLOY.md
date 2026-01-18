# 🚀 Quick Vercel Deployment Guide

## ⚡ Fast Deployment Steps

### 1. **Install Vercel CLI** (if not already installed)
```bash
npm install -g vercel
```

### 2. **Deploy Backend**
```bash
cd express_backend
vercel --prod
```

When prompted:
- Project name: `medshare-backend`
- Settings: Accept defaults

### 3. **Deploy Frontend**
```bash
cd ../frontend
vercel --prod
```

When prompted:
- Project name: `medshare-frontend`
- Build command: `npm run build`
- Output directory: `dist`

### 4. **Set Environment Variables**

#### Backend Environment Variables (in Vercel Dashboard):
```bash
# Go to: https://vercel.com/your-username/medshare-backend/settings/environment-variables

SUPABASE_URL=https://nvbjeseldwocmssostbo.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
NEWS_API_KEY=9c712e4821a94b5aab15929ce33eee68
GEMINI_API_KEY=AIzaSyDVZ7L6aqVgTASnn3I7iWPskUKzTpyc2nk
WOODWIDE_API_KEY=sk_0iflTY1yeLpobTrTFrPdWjau6V29bfBQoSw0GgZMeno
LIVEKIT_URL=wss://nexhacks-vbpkc2mp.livekit.cloud
LIVEKIT_API_KEY=API3X49VgfpdiRt
LIVEKIT_API_SECRET=dZ8gdwiTg3EnsBgbiKjx8m0Q2eaBnftv1xCa5hJB7N0
```

#### Frontend Environment Variables:
```bash
# Go to: https://vercel.com/your-username/medshare-frontend/settings/environment-variables

VITE_BACKEND_URL=https://medshare-backend.vercel.app
VITE_GEMINI_API_KEY=AIzaSyDVZ7L6aqVgTASnn3I7iWPskUKzTpyc2nk
VITE_LIVEKIT_URL=wss://nexhacks-vbpkc2mp.livekit.cloud
VITE_LIVEKIT_API_KEY=API3X49VgfpdiRt
VITE_LIVEKIT_API_SECRET=dZ8gdwiTg3EnsBgbiKjx8m0Q2eaBnftv1xCa5hJB7N0
```

### 5. **Redeploy After Setting Variables**
```bash
# Backend
cd express_backend
vercel --prod

# Frontend
cd ../frontend
vercel --prod
```

---

## ✅ CSV Upload Fixed!

The CSV upload now:
- ✅ Works with Vercel serverless functions
- ✅ Processes files from memory (no disk writes)
- ✅ Validates data before upload
- ✅ Returns detailed error messages
- ✅ Handles large files efficiently

### Test CSV Upload:
```bash
curl -X POST https://your-backend.vercel.app/api/inventory/upload-csv \
  -F "file=@/path/to/your/file.csv"
```

---

## 🎯 One-Command Deployment

Or use this quick script:

```bash
# From project root
cd express_backend && vercel --prod && cd ../frontend && vercel --prod && cd ..
```

---

## 📝 After Deployment

Your apps will be available at:
- **Backend**: `https://medshare-backend-[your-username].vercel.app`
- **Frontend**: `https://medshare-frontend-[your-username].vercel.app`

Update the frontend `VITE_BACKEND_URL` with your actual backend URL!

---

## 🔧 Troubleshooting

### If CSV upload fails:
1. Check Supabase credentials are set
2. Verify file format (must be CSV)
3. Check file size (< 10MB)
4. Review Vercel function logs

### If deployment fails:
```bash
# Clear cache and redeploy
vercel --prod --force
```

---

## ✅ What's Deployed

- ✅ Full Express backend (serverless)
- ✅ React frontend (static)
- ✅ CSV upload (memory-based)
- ✅ All API endpoints
- ✅ AI features (Gemini)
- ✅ LiveKit integration
- ✅ 5 pre-generated reports

**Your app is production-ready!** 🚀
