// LiveKit Configuration
export const livekitConfig = {
  url: import.meta.env.VITE_LIVEKIT_URL || 'wss://nexhacks-vfgvn8ou.livekit.cloud',
  apiKey: import.meta.env.VITE_LIVEKIT_API_KEY || 'APINKVr8rgsXzbe',
  apiSecret: import.meta.env.VITE_LIVEKIT_API_SECRET || 'XWDnkhtkcfGxuxRpkLt9gx3S6fojlp4qccGFDlhdKuG',
};

/**
 * Generate LiveKit access token (CLIENT-SIDE - DEMO ONLY!)
 * In production, this MUST be done on backend with proper JWT signing
 */
export async function generateLiveKitToken(
  roomName: string, 
  participantName: string
): Promise<string> {
  // FOR PRODUCTION: Call your backend API
  // const response = await fetch('/api/livekit/token', {
  //   method: 'POST',
  //   body: JSON.stringify({ roomName, participantName })
  // });
  // return response.json().token;

  // DEMO ONLY: Generate basic token client-side
  try {
    const payload = {
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      },
      identity: participantName,
      name: participantName,
      metadata: JSON.stringify({
        app: 'medshare',
        role: 'scanner',
      }),
    };

    // Simple encoding (NOT SECURE - use backend in production!)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({
      ...payload,
      iss: livekitConfig.apiKey,
      sub: participantName,
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    }));
    
    // Create signature (simplified - use proper crypto in production)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${header}.${body}`);
    const keyData = encoder.encode(livekitConfig.apiSecret);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return `${header}.${body}.${signatureBase64}`;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate LiveKit token');
  }
}

export interface DrugLabelData {
  drugName?: string;
  ndcCode?: string;
  lotNumber?: string;
  expiryDate?: string;
  manufacturer?: string;
  dosage?: string;
  confidence?: number;
}
