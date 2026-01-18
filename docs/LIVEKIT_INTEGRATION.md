# LiveKit Computer Vision Integration

## Overview
This project now includes **LiveKit-powered computer vision** for real-time drug label scanning using your webcam. The integration allows healthcare facilities to quickly scan and add medications to their inventory through an AI-powered camera interface.

## 🎯 Features

### Real-time Webcam Scanning
- **Live camera feed** with visual scanning frame overlay
- **Automatic frame processing** every 3 seconds
- **Manual capture** option for on-demand scanning
- **Visual feedback** with status indicators and animations

### AI-Powered Drug Label Recognition
The system extracts the following information from drug labels:
- Drug Name
- NDC Code
- Lot Number
- Expiration Date
- Manufacturer
- Dosage Information
- Confidence Score

### Automatic Inventory Integration
- Detected medications are automatically added to inventory
- Duplicate detection merges quantities with existing entries
- Real-time alerts and notifications via toast messages
- Full integration with existing FIFO and expiration tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- LiveKit account with API credentials
- Modern browser with webcam support

### Installation

1. **Install Dependencies**
```bash
cd frontend
npm install
```

The following LiveKit packages are now installed:
- `@livekit/components-react` - React components for LiveKit
- `livekit-client` - LiveKit client SDK

### Configuration

#### Environment Variables
Create a `.env` file in the `frontend/` directory:

```bash
VITE_LIVEKIT_URL=wss://nexhacks-vfgvn8ou.livekit.cloud
VITE_LIVEKIT_API_KEY=APINKVr8rgsXzbe
VITE_LIVEKIT_API_SECRET=XWDnkhtkcfGxuxRpkLt9gx3S6fojlp4qccGFDlhdKuG
```

**Note:** The credentials shown above are your actual LiveKit credentials. For production deployment:
- Move credential generation to a secure backend API
- Never commit `.env` files to version control
- Use environment-specific configuration

#### Configuration File
The LiveKit configuration is centralized in `frontend/src/config/livekit.ts`:

```typescript
export const livekitConfig = {
  url: import.meta.env.VITE_LIVEKIT_URL || 'wss://nexhacks-vfgvn8ou.livekit.cloud',
  apiKey: import.meta.env.VITE_LIVEKIT_API_KEY || 'APINKVr8rgsXzbe',
  apiSecret: import.meta.env.VITE_LIVEKIT_API_SECRET || '...',
};
```

### Running the Application

```bash
cd frontend
npm run dev
```

The application will be available at: **http://localhost:5173/**

## 📱 Usage Guide

### Accessing the Webcam Scanner

1. **From Dashboard:**
   - Click the "Scan Drug Label" button in Quick Actions

2. **From Header:**
   - Use the camera shortcut in the navigation

### Scanning Process

1. **Click "Start Camera"**
   - Grant camera permissions when prompted
   - Wait for camera to activate (status shows "Active")

2. **Position Drug Label**
   - Place drug label within the scanning frame
   - Ensure good lighting and focus
   - Keep label steady for best results

3. **Capture & Scan**
   - Automatic scanning occurs every 3 seconds
   - Or click "Capture & Scan" for manual scan
   - Processing indicator shows when analyzing

4. **Review Results**
   - Detected information appears in the result card
   - Confidence score indicates accuracy
   - Data is automatically added to inventory

5. **Manage Camera**
   - Click "Stop Camera" to turn off webcam
   - Click "Close" to exit scanner

## 🏗️ Architecture

### Component Structure

```
frontend/src/
├── config/
│   └── livekit.ts                    # LiveKit configuration
├── app/
│   ├── components/
│   │   ├── LiveKitWebcam.tsx        # Main webcam component
│   │   └── ...
│   └── App.tsx                       # Main app with integration
```

### Key Components

#### `LiveKitWebcam.tsx`
Main component providing:
- Webcam access and control
- Frame capture and processing
- Visual feedback and animations
- Data detection callbacks

**Props:**
```typescript
interface LiveKitWebcamProps {
  onClose: () => void;                // Close modal handler
  onDataDetected?: (data: DrugLabelData) => void;  // Detection callback
}
```

#### `DrugLabelData` Interface
```typescript
interface DrugLabelData {
  drugName?: string;
  ndcCode?: string;
  lotNumber?: string;
  expiryDate?: string;
  manufacturer?: string;
  dosage?: string;
  confidence?: number;
}
```

### Data Flow

1. **User activates camera** → `startCamera()`
2. **Video stream captured** → `videoRef`
3. **Frame extracted to canvas** → `canvasRef`
4. **Image data sent for processing** → `processFrame()`
5. **OCR/AI analysis** → External API or LiveKit Agent
6. **Structured data returned** → `setDetectedData()`
7. **Callback triggered** → `onDataDetected()`
8. **Inventory updated** → `handleDrugLabelDetected()`

## 🔧 Technical Implementation

### Browser APIs Used
- **MediaDevices API** - Webcam access
- **Canvas API** - Frame capture and processing
- **Crypto API** - Token generation (temporary)

### Frame Processing
```typescript
const processFrame = useCallback(async () => {
  // 1. Draw video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // 2. Convert to base64 JPEG
  const imageData = canvas.toDataURL('image/jpeg', 0.8);
  
  // 3. Send to processing API
  // In production: OCR service (Tesseract, Google Vision, etc.)
  
  // 4. Parse and structure results
  // 5. Trigger callback with detected data
}, []);
```

### Camera Controls
- **Start/Stop** - Full camera lifecycle management
- **Auto-cleanup** - Resources released on unmount
- **Error handling** - Permission and hardware errors
- **Status tracking** - Visual feedback for all states

## 🎨 UI/UX Features

### Visual Feedback
- **Scanning frame overlay** with animated borders
- **Scanning line** that sweeps across frame
- **Status badges** (Idle, Starting, Active, Error)
- **Processing indicators** with loading animations
- **Confidence scores** displayed with results

### Animations (Framer Motion)
- Modal entry/exit transitions
- Scanning frame pulse effect
- Processing status updates
- Smooth state changes

### Responsive Design
- Modal adapts to screen size
- Video maintains 16:9 aspect ratio
- Touch-friendly controls
- Mobile-optimized layout

## 🔐 Security Considerations

### Current Implementation (Demo)
⚠️ **Client-side token generation** - Not secure for production

### Production Recommendations

1. **Backend Token Generation**
   ```bash
   npm install @livekit/server-sdk
   ```

   Create API endpoint:
   ```typescript
   // backend/routes/livekit.ts
   import { AccessToken } from 'livekit-server-sdk';
   
   app.post('/api/livekit/token', async (req, res) => {
     const token = new AccessToken(
       process.env.LIVEKIT_API_KEY,
       process.env.LIVEKIT_API_SECRET,
       {
         identity: req.body.identity,
         ttl: '1h',
       }
     );
     
     token.addGrant({
       roomJoin: true,
       room: req.body.room,
     });
     
     res.json({ token: await token.toJwt() });
   });
   ```

2. **Environment Variables**
   - Use `.env.local` for sensitive data
   - Never commit credentials
   - Use different keys per environment

3. **API Security**
   - Implement rate limiting
   - Add authentication/authorization
   - Validate all inputs
   - Use HTTPS only

## 🚀 Production Enhancement Roadmap

### OCR Integration
**Option 1: Tesseract.js (Client-side)**
```bash
npm install tesseract.js
```

**Option 2: Google Cloud Vision API (Backend)**
```bash
npm install @google-cloud/vision
```

**Option 3: LiveKit Agents (Recommended)**
- Real-time processing with LiveKit infrastructure
- Scalable and optimized for video streams
- Built-in quality control

### AI/ML Enhancement
- Train custom model for drug label recognition
- Implement confidence threshold filtering
- Add label format validation
- Support barcode/QR code scanning

### Database Integration
- Store scan history
- Track accuracy metrics
- Implement duplicate detection
- Enable batch processing

### Advanced Features
- Multi-language support
- Batch scanning mode
- Image enhancement filters
- Manual correction interface
- Audit trail and logging

## 🐛 Troubleshooting

### Camera Not Starting
**Issue:** Permission denied or camera not found

**Solutions:**
1. Check browser camera permissions
2. Ensure no other app is using the camera
3. Try a different browser (Chrome/Edge recommended)
4. Check browser console for detailed errors

### Poor Detection Accuracy
**Improvements:**
1. Ensure good lighting conditions
2. Hold label steady within frame
3. Keep label perpendicular to camera
4. Clean camera lens
5. Reduce camera-to-label distance

### Performance Issues
**Optimizations:**
1. Reduce processing frequency (increase interval)
2. Lower video resolution
3. Optimize image compression quality
4. Process frames only when needed
5. Implement frame skipping logic

## 📚 Additional Resources

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit React Components](https://docs.livekit.io/client-sdk-react/)
- [MDN MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [Canvas API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 🤝 Contributing

When enhancing the webcam functionality:

1. Test across multiple browsers
2. Ensure proper resource cleanup
3. Add error boundaries
4. Implement comprehensive logging
5. Update this documentation

## 📝 License

This implementation is part of the MedShare project for NexHacks 3.

---

**Status:** ✅ Implementation Complete  
**Last Updated:** January 18, 2026  
**Development Server:** http://localhost:5173/
