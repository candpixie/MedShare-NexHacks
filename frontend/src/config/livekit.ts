// LiveKit Configuration
export const livekitConfig = {
  url: import.meta.env.VITE_LIVEKIT_URL || 'wss://nexhacks-vfgvn8ou.livekit.cloud',
  apiKey: import.meta.env.VITE_LIVEKIT_API_KEY || 'APINKVr8rgsXzbe',
  apiSecret: import.meta.env.VITE_LIVEKIT_API_SECRET || 'XWDnkhtkcfGxuxRpkLt9gx3S6fojlp4qccGFDlhdKuG',
};

// Generate a LiveKit access token (this should ideally be done on backend)
export async function generateToken(roomName: string, participantName: string): Promise<string> {
  // For production, this should be an API call to your backend
  // Backend code will use @livekit/server-sdk to generate tokens
  // For now, using client-side generation (not secure for production!)
  
  const encoder = new TextEncoder();
  const data = encoder.encode(`${roomName}:${participantName}:${livekitConfig.apiKey}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // This is a simplified token - in production use proper JWT with @livekit/server-sdk
  return btoa(JSON.stringify({
    roomName,
    participantName,
    apiKey: livekitConfig.apiKey,
    timestamp: Date.now(),
    signature: hashHex,
  }));
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
