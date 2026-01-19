# 🔑 Supabase API Key Setup Guide

## ⚠️ ACTION REQUIRED: Get Your Supabase Anon Key

The Supabase API key you provided appears to be incomplete or in an incorrect format. You need to get the **actual anon key** from your Supabase dashboard.

---

## 📋 Steps to Get Your Supabase Keys

### Step 1: Open Supabase Dashboard

Go to your project's API settings page:

🔗 **Direct Link**: https://supabase.com/dashboard/project/nvbjeseldwocmssostbo/settings/api

Or manually navigate:
1. Go to https://supabase.com/dashboard
2. Select your project: `nvbjeseldwocmssostbo`
3. Click on "Settings" (⚙️ icon in sidebar)
4. Click on "API" section

### Step 2: Copy the API Keys

You'll see two important keys on that page:

#### 1. **Project URL** ✅ (Already configured)
```
https://nvbjeseldwocmssostbo.supabase.co
```

#### 2. **anon public** key (YOU NEED THIS!)
- Look for a section labeled **"Project API keys"**
- Find the key labeled **"anon" or "anon public"**
- It should be a long JWT token starting with `eyJ...`
- Click the **copy** button (📋) next to it

**Example format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJwcm9qZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTU3NjAwMH0.SIGNATURE_PART_HERE
```

### Step 3: Update Your Environment File

Once you have the **anon public** key, update the file:

**File**: `express_backend/development.env`

Replace this line:
```env
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
```

With your actual key:
```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here
```

---

## 🧪 Test Your Connection

After updating the key, test it:

```bash
cd express_backend
node test-connection.js
```

You should see:
```
✅ Connection successful!
📊 Found X records in inventory table
```

---

## 🔐 Security Note

The **anon (public)** key is safe to use in:
- ✅ Frontend applications
- ✅ Backend servers
- ✅ Mobile apps
- ✅ Public repositories (with proper RLS policies)

**DO NOT** share your **service_role** key publicly!

---

## 🚀 Alternative: Use Mock Data Mode

If you can't access Supabase right now, the app will **automatically run with mock data**:

```bash
# Just start without Supabase configured
cd express_backend
npm start
```

The backend will detect missing credentials and use demo data instead.

---

## 📞 Need Help?

### Option 1: Check Supabase Status
Visit: https://status.supabase.com

### Option 2: Verify Project Access
1. Can you log into: https://supabase.com/dashboard?
2. Do you see project `nvbjeseldwocmssostbo` in your projects list?
3. Are you the owner or do you have appropriate permissions?

### Option 3: Create New Project
If you don't have access to this project, create a new one:
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Create project and get new credentials
4. Update the **SUPABASE_URL** and **SUPABASE_ANON_KEY** accordingly

---

## ✅ Once Configured

After you have the correct API key configured, you can:

1. **Test connection**:
   ```bash
   cd express_backend
   node test-connection.js
   ```

2. **Load demo data**:
   ```bash
   cd express_backend
   node load-demo-data.js
   ```

3. **Run the demo**:
   ```bash
   # From project root
   ./run-demo.sh
   ```

---

## 🎯 Current Configuration

Your current settings in `express_backend/development.env`:

```env
SUPABASE_URL=https://nvbjeseldwocmssostbo.supabase.co  ✅
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE          ❌ NEEDS UPDATE
```

**Next Step**: Get your anon key from the Supabase dashboard and update the file!

---

## 💡 Quick Reference

| Item | Status | Action Required |
|------|--------|----------------|
| Supabase URL | ✅ Configured | None |
| Supabase Anon Key | ❌ Missing | Get from dashboard |
| Gemini API | ✅ Configured | None |
| LiveKit | ✅ Configured | None |
| News API | ✅ Configured | None |
| WoodWide API | ✅ Configured | None |

**Only the Supabase anon key needs to be updated!**
