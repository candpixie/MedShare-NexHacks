# 🔧 Vercel NOT_FOUND Debugging Guide

## Current Issue: Still Getting NOT_FOUND

The root `vercel.json` has been updated with the correct monorepo build configuration, but if you're still seeing NOT_FOUND, here's how to diagnose and fix it:

---

## ✅ **RECOMMENDED: Deploy Separate Projects (Best Practice)**

Your repo has both frontend and backend in subdirectories. The cleanest approach is **two separate Vercel projects**:

### Step 1: Deploy Frontend
```bash
cd frontend
vercel --prod
```

**IMPORTANT:** When prompted by Vercel CLI:
- **"Set up and deploy?"** → Yes
- **"Which scope?"** → Select your account
- **"Link to existing project?"** → No (or select if you have one)
- **"What's your project's name?"** → `medshare-frontend`
- **"In which directory is your code located?"** → `.` (just press Enter, you're already in frontend/)
- **Override settings?** → No (Vercel will auto-detect Vite)

### Step 2: Deploy Backend
```bash
cd ../express_backend
vercel --prod
```

**IMPORTANT:** When prompted:
- **"What's your project's name?"** → `medshare-backend`
- **"In which directory is your code located?"** → `.`

### Step 3: Update Frontend Environment Variables

In Vercel Dashboard:
1. Go to your `medshare-frontend` project
2. Settings → Environment Variables
3. Add:
   ```
   VITE_BACKEND_URL=https://medshare-backend-YOUR-USERNAME.vercel.app
   ```
4. Redeploy frontend:
   ```bash
   cd frontend
   vercel --prod
   ```

---

## 🔍 Alternative: Deploy from Root (Current Attempt)

If you want to deploy the frontend from the repo root, here's what to check:

### Check 1: Vercel Project Settings in Dashboard

Go to `vercel.com/dashboard` → Your Project → Settings:

1. **Root Directory:** Should be `.` (root) OR set to `frontend`
   - If it's blank, set it to `frontend`
   - This is the #1 cause of NOT_FOUND errors

2. **Framework Preset:** Should auto-detect as "Vite" if Root Directory is `frontend`

3. **Build Command:** Should be `npm run build` (if Root Directory = `frontend`)
   - OR `cd frontend && npm install && npm run build` (if Root Directory = `.`)

4. **Output Directory:** Should be `dist` (if Root Directory = `frontend`)
   - OR `frontend/dist` (if Root Directory = `.`)

### Check 2: Which URL is giving NOT_FOUND?

**Scenario A: Deployment URL gives NOT_FOUND**
- Example: `https://medshare-nexhacks-9.vercel.app` → 404
- **Cause:** Build failed or output directory is wrong
- **Fix:** Check deployment logs in Vercel Dashboard → Deployments → Click latest → View Build Logs
- Look for errors during build step

**Scenario B: Specific routes give NOT_FOUND (homepage works)**
- Example: Homepage loads, but `/settings` or `/reports` → 404
- **Cause:** SPA routing not configured
- **Fix:** The updated `vercel.json` should fix this with rewrites to `/index.html`

**Scenario C: API calls give NOT_FOUND**
- Example: Frontend loads, but API calls to `/api/inventory` fail
- **Cause:** Backend not deployed or wrong VITE_BACKEND_URL
- **Fix:** Deploy backend separately and set `VITE_BACKEND_URL` env var in frontend project

### Check 3: Deployment Logs

```bash
# Get recent deployment status
vercel ls

# Check logs of specific deployment
vercel logs [deployment-url]
```

Look for:
- ❌ "No output directory found"
- ❌ "Build failed"
- ❌ "Cannot find module"
- ✅ "Build completed" + file size output

---

## 🚨 Common Mistakes & Fixes

### Mistake 1: Deploying root without Root Directory set
**Symptom:** Vercel deploys, but everything is 404
**Fix:** In Vercel Dashboard → Settings → Set Root Directory to `frontend`

### Mistake 2: Environment variables not set
**Symptom:** Build succeeds, but app doesn't work (blank page or errors)
**Fix:** Add all `VITE_*` variables in Vercel Dashboard → Settings → Environment Variables

### Mistake 3: Wrong vercel.json syntax
**Symptom:** Deployment ignores your config
**Fix:** Use the updated root `vercel.json` OR delete it and use Root Directory setting instead

### Mistake 4: Multiple vercel.json files conflicting
**Symptom:** Unpredictable behavior
**Fix:** 
- **Option A:** Keep only root `vercel.json`, remove `frontend/vercel.json`
- **Option B:** Delete root `vercel.json`, use `frontend/vercel.json` with Root Directory = `frontend`

---

## 🎯 Quick Diagnostic Commands

Run these to understand what Vercel sees:

```bash
# 1. Check what files are in your build output locally
cd /Users/candyxie/MedShare-NexHacks-9/frontend
npm run build
ls -la dist/

# 2. Verify index.html exists
cat dist/index.html | head -10

# 3. Check current Vercel deployments
vercel ls

# 4. Inspect project config
vercel project ls
```

---

## 🔄 Nuclear Option: Fresh Deployment

If all else fails, start completely fresh:

```bash
# 1. Remove all Vercel configs from repo root
cd /Users/candyxie/MedShare-NexHacks-9
rm -f vercel.json
rm -rf .vercel

# 2. Remove Vercel config from frontend
cd frontend
rm -rf .vercel

# 3. Deploy frontend fresh
vercel --prod

# When prompted:
#   Root Directory: . (you're in frontend/)
#   Build settings: Accept auto-detected Vite settings
```

---

## 📋 What to Share for More Help

If you're still stuck, share:

1. **Deployment URL** that's showing NOT_FOUND
2. **Screenshot** of Vercel Dashboard → Settings → General (showing Root Directory, Build Command, Output Directory)
3. **Build logs** from Vercel Dashboard → Deployments → Latest
4. **Terminal output** from `vercel --prod` command
5. **Which files exist** after local build: `ls -R frontend/dist/`

---

## ✅ Expected Working Setup

Once fixed, you should see:

- ✅ Frontend deploys successfully
- ✅ `https://your-frontend.vercel.app` loads the app
- ✅ Routes like `/inventory`, `/reports` work (SPA routing)
- ✅ API calls go to backend URL (set via `VITE_BACKEND_URL`)
- ✅ No 404 errors for assets in `/dist/assets/`

---

**Next Step:** Try the "RECOMMENDED" separate projects approach above - it's the most reliable for your monorepo structure.
