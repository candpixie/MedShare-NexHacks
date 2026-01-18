/**
 * LiveKit Backend API Route (Production-Ready)
 * 
 * This file shows how to securely generate LiveKit tokens on the backend.
 * Move this logic to your Express backend for production use.
 * 
 * Installation:
 * npm install @livekit/server-sdk express dotenv
 */

import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

const router = express.Router();

/**
 * Generate LiveKit Access Token
 * 
 * POST /api/livekit/token
 * 
 * Body:
 * {
 *   "identity": "user123",        // Unique user identifier
 *   "roomName": "drug-scanner",   // Room name (e.g., "hospital-123-scanner")
 *   "metadata": {}                 // Optional user metadata
 * }
 */
router.post('/api/livekit/token', async (req, res) => {
  try {
    const { identity, roomName, metadata } = req.body;

    // Validate inputs
    if (!identity || !roomName) {
      return res.status(400).json({
        error: 'Missing required fields: identity and roomName',
      });
    }

    // Get credentials from environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials not configured');
      return res.status(500).json({
        error: 'Server configuration error',
      });
    }

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: '2h', // Token valid for 2 hours
      metadata: JSON.stringify(metadata || {}),
    });

    // Add room permissions
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,      // Allow publishing video/audio
      canPublishData: true,  // Allow sending data messages
      canSubscribe: true,    // Allow receiving streams
    });

    // Generate JWT token
    const jwt = await token.toJwt();

    return res.json({
      token: jwt,
      url: process.env.LIVEKIT_URL,
      identity,
      roomName,
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return res.status(500).json({
      error: 'Failed to generate access token',
    });
  }
});

/**
 * Get LiveKit Room Information
 * 
 * GET /api/livekit/room/:roomName
 */
router.get('/api/livekit/room/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;

    // Here you would typically fetch room info from LiveKit API
    // For now, return basic room data
    
    return res.json({
      roomName,
      status: 'active',
      participants: 0,
    });
  } catch (error) {
    console.error('Error fetching room info:', error);
    return res.status(500).json({
      error: 'Failed to fetch room information',
    });
  }
});

/**
 * Process Captured Frame (Computer Vision Endpoint)
 * 
 * POST /api/livekit/process-frame
 * 
 * Body:
 * {
 *   "image": "data:image/jpeg;base64,...",  // Base64 encoded image
 *   "roomName": "drug-scanner"
 * }
 */
router.post('/api/livekit/process-frame', async (req, res) => {
  try {
    const { image, roomName } = req.body;

    if (!image) {
      return res.status(400).json({
        error: 'Missing image data',
      });
    }

    // TODO: Implement actual OCR/Computer Vision processing
    // Options:
    // 1. Google Cloud Vision API
    // 2. AWS Rekognition
    // 3. Azure Computer Vision
    // 4. Tesseract OCR
    // 5. Custom ML model

    // Mock response for now
    const mockResult = {
      drugName: 'Propofol 200mg/20mL',
      ndcCode: '00409-4676-01',
      lotNumber: `LOT${new Date().getFullYear()}A${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
      manufacturer: 'Hospira Inc.',
      dosage: '200mg/20mL',
      confidence: 0.85 + Math.random() * 0.1,
    };

    return res.json({
      success: true,
      data: mockResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing frame:', error);
    return res.status(500).json({
      error: 'Failed to process image',
    });
  }
});

/**
 * Example: Google Cloud Vision Integration
 */
async function processImageWithGoogleVision(imageBase64: string) {
  // Requires: npm install @google-cloud/vision
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();

  const [result] = await client.textDetection({
    image: { content: imageBase64.split(',')[1] },
  });

  const detections = result.textAnnotations;
  const fullText = detections?.[0]?.description || '';

  // Parse text to extract drug information
  const drugInfo = parseDrugLabel(fullText);

  return drugInfo;
}

/**
 * Parse detected text to extract structured drug information
 */
function parseDrugLabel(text: string) {
  // Implement parsing logic based on drug label format
  // This is a simplified example
  
  const ndcMatch = text.match(/NDC[:\s]*(\d{5}-\d{4}-\d{2})/i);
  const lotMatch = text.match(/LOT[:\s]*([A-Z0-9]+)/i);
  const expMatch = text.match(/EXP[:\s]*(\d{2}\/\d{2}\/\d{4})/i);

  return {
    drugName: extractDrugName(text),
    ndcCode: ndcMatch?.[1],
    lotNumber: lotMatch?.[1],
    expiryDate: expMatch?.[1],
    confidence: 0.9,
  };
}

function extractDrugName(text: string): string | undefined {
  // Implement drug name extraction logic
  // This could use NLP or a drug database lookup
  return undefined;
}

export default router;

/**
 * Usage in main Express app:
 * 
 * import livekitRoutes from './routes/livekit';
 * app.use(livekitRoutes);
 */

/**
 * Frontend Integration Example:
 * 
 * // Get token from backend
 * const response = await fetch('/api/livekit/token', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     identity: userId,
 *     roomName: `hospital-${hospitalId}-scanner`,
 *   }),
 * });
 * 
 * const { token, url } = await response.json();
 * 
 * // Connect to LiveKit room
 * const room = new Room();
 * await room.connect(url, token);
 * 
 * // Process captured frame
 * const frameData = canvas.toDataURL('image/jpeg', 0.8);
 * const result = await fetch('/api/livekit/process-frame', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     image: frameData,
 *     roomName: room.name,
 *   }),
 * });
 * 
 * const { data } = await result.json();
 * console.log('Detected drug info:', data);
 */
