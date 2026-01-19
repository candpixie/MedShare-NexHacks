# ⚡ SUPER QUICK VERCEL DEPLOYMENT

## 🚀 Deploy in 2 Minutes

### Option 1: Automated Script
```bash
./deploy-vercel.sh
```

### Option 2: Manual (3 Commands)
```bash
# 1. Deploy backend
cd express_backend && vercel --prod

# 2. Deploy frontend
cd ../frontend && vercel --prod

# 3. Done! 🎉
```

---

## 📝 After Deployment

### Set Environment Variables in Vercel Dashboard:

#### Backend (https://vercel.com/your-project/settings/environment-variables):
```
SUPABASE_URL=https://nvbjeseldwocmssostbo.supabase.co
SUPABASE_ANON_KEY=[GET FROM SUPABASE DASHBOARD]
GEMINI_API_KEY=AIzaSyDVZ7L6aqVgTASnn3I7iWPskUKzTpyc2nk
NEWS_API_KEY=9c712e4821a94b5aab15929ce33eee68
WOODWIDE_API_KEY=sk_0iflTY1yeLpobTrTFrPdWjau6V29bfBQoSw0GgZMeno
LIVEKIT_URL=wss://nexhacks-vbpkc2mp.livekit.cloud
LIVEKIT_API_KEY=API3X49VgfpdiRt
LIVEKIT_API_SECRET=dZ8gdwiTg3EnsBgbiKjx8m0Q2eaBnftv1xCa5hJB7N0
```

#### Frontend:
```
VITE_BACKEND_URL=[YOUR BACKEND VERCEL URL]
VITE_GEMINI_API_KEY=AIzaSyDVZ7L6aqVgTASnn3I7iWPskUKzTpyc2nk
VITE_LIVEKIT_URL=wss://nexhacks-vbpkc2mp.livekit.cloud
VITE_LIVEKIT_API_KEY=API3X49VgfpdiRt
VITE_LIVEKIT_API_SECRET=dZ8gdwiTg3EnsBgbiKjx8m0Q2eaBnftv1xCa5hJB7N0
```

Then redeploy:
```bash
vercel --prod
```

---

## ✅ CSV Upload Fixed!

**Now works on Vercel!**
- ✅ No file system writes (serverless compatible)
- ✅ Processes from memory buffer
- ✅ Fast and efficient
- ✅ Handles large files

**Test it:**
```bash
curl -X POST https://your-backend.vercel.app/api/inventory/upload-csv \
  -F "file=@inventory.csv"
```

---

## 🎯 Your URLs

After deployment:
- **Backend**: `https://medshare-backend-[username].vercel.app`
- **Frontend**: `https://medshare-frontend-[username].vercel.app`

---

## 💡 Pro Tips

1. **Connect GitHub**: Let Vercel auto-deploy on push
2. **Custom Domain**: Add your own domain in settings
3. **Monitor Logs**: Check Vercel dashboard for errors
4. **Get Supabase Key**: See `GET_SUPABASE_KEY.md`

---

## ✅ What's Deployed

- ✅ Full backend API (serverless functions)
- ✅ Frontend React app (static)
- ✅ CSV upload (memory-based, fast)
- ✅ AI features (Gemini)
- ✅ LiveKit integration
- ✅ Reports system
- ✅ All features working!

**Deploy now and go live in minutes!** 🚀
