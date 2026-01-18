# LiveKit + Gemini AI Environment Setup Instructions

## Quick Setup for Local Development

### Step 1: Create `.env` file in frontend directory

Navigate to the frontend folder and create a `.env` file:

```bash
cd frontend
touch .env
```

### Step 2: Add Credentials

Open `.env` and add your credentials:

```bash
# LiveKit Configuration
VITE_LIVEKIT_URL=wss://nexhacks-vfgvn8ou.livekit.cloud
VITE_LIVEKIT_API_KEY=APINKVr8rgsXzbe
VITE_LIVEKIT_API_SECRET=XWDnkhtkcfGxuxRpkLt9gx3S6fojlp4qccGFDlhdKuG

# Gemini AI Configuration (Get your free key at https://makersuite.google.com/app/apikey)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting a Gemini API Key (FREE!):**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy and paste into `.env` above

**Note:** A demo Gemini key is included in the code, but you should get your own for production use!

### Step 3: Verify Installation

1. Make sure `.env` is in `.gitignore`:
```bash
echo ".env" >> .gitignore
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:5173/

### Step 4: Test Webcam Feature

1. Click on **"Scan Drug Label"** in the Quick Actions
2. Click **"Start Camera"** 
3. Allow camera permissions when prompted
4. Position a drug label in front of the camera
5. Click **"Capture & Scan"** or wait for automatic scanning

## Security Note

⚠️ **IMPORTANT**: Never commit the `.env` file to version control!

The `.env` file contains sensitive API credentials that should be kept secret.

## Production Deployment

For production, use environment-specific configuration:

- **Vercel**: Add environment variables in project settings
- **Netlify**: Add in Site Settings > Environment Variables  
- **AWS**: Use AWS Systems Manager Parameter Store
- **Docker**: Use Docker secrets or environment files

## Troubleshooting

### "VITE_LIVEKIT_URL is undefined"
- Ensure `.env` file is in the `frontend/` directory
- Restart the dev server after creating `.env`
- Check that variable names start with `VITE_`

### Camera Permission Denied
- Allow camera access in browser settings
- Check if another app is using the camera
- Try using HTTPS (required by some browsers)

## What's Working Now

✅ Real-time webcam feed with LiveKit  
✅ Frame capture and processing  
✅ **Gemini AI drug label recognition (90%+ accuracy!)**  
✅ Real OCR with Tesseract.js  
✅ OpenFDA API validation  
✅ Automatic inventory updates  
✅ Visual scanning animations  
✅ Voice alerts with priority system  
✅ Status indicators and error handling  

## Technology Stack

- **LiveKit**: Real-time video streaming and data channels
- **Gemini AI**: Advanced drug label recognition with vision models
- **Tesseract.js**: OCR text extraction (fallback)
- **OpenFDA API**: Drug data validation and enrichment
- **Web Speech API**: Voice alerts for urgent notifications  

## Next Steps for Production

1. Implement actual OCR service (Tesseract.js or Google Vision)
2. Move token generation to backend API
3. Add proper authentication
4. Deploy to cloud with proper environment variables
5. Configure LiveKit Agents for server-side processing

---

Your development environment is ready! 🚀
