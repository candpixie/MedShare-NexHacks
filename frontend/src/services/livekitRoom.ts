/**
 * Real LiveKit Room Service
 * Handles actual LiveKit room connections, video streaming, and data channels
 */

import { Room, RoomEvent, Track, DataPacket_Kind, LocalParticipant, RemoteParticipant } from 'livekit-client';
import { livekitConfig } from '@/config/livekit';

export interface LiveKitMessage {
  type: 'scan_request' | 'scan_result' | 'status';
  data?: any;
  timestamp: number;
}

class LiveKitRoomService {
  private room: Room | null = null;
  private isConnected: boolean = false;
  private messageCallbacks: ((message: LiveKitMessage) => void)[] = [];
  private statusCallbacks: ((status: string) => void)[] = [];

  /**
   * Connect to LiveKit room with real video streaming
   */
  async connect(roomName: string, participantName: string): Promise<Room> {
    try {
      // Create room instance
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: {
            width: 1280,
            height: 720,
            frameRate: 30,
          },
        },
      });

      // Set up event listeners
      this.setupRoomEvents();

      // Generate token (in production, call your backend)
      const token = this.generateClientToken(roomName, participantName);

      // Connect to LiveKit cloud
      await this.room.connect(livekitConfig.url, token);

      this.isConnected = true;
      this.notifyStatus('Connected to LiveKit');
      
      console.log('✅ Connected to LiveKit room:', roomName);
      return this.room;
    } catch (error) {
      console.error('❌ Failed to connect to LiveKit:', error);
      this.notifyStatus('Failed to connect');
      throw error;
    }
  }

  /**
   * Publish webcam video through LiveKit
   */
  async publishVideo(stream: MediaStream): Promise<void> {
    if (!this.room || !this.isConnected) {
      throw new Error('Not connected to LiveKit room');
    }

    try {
      const videoTrack = stream.getVideoTracks()[0];
      
      await this.room.localParticipant.publishTrack(videoTrack, {
        name: 'webcam',
        source: Track.Source.Camera,
        videoCodec: 'vp8',
      });

      this.notifyStatus('Video streaming through LiveKit');
      console.log('✅ Video track published to LiveKit');
    } catch (error) {
      console.error('❌ Failed to publish video:', error);
      throw error;
    }
  }

  /**
   * Send data through LiveKit data channel
   */
  async sendData(message: LiveKitMessage): Promise<void> {
    if (!this.room || !this.isConnected) {
      throw new Error('Not connected to LiveKit room');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));

      await this.room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
      
      console.log('✅ Data sent through LiveKit:', message.type);
    } catch (error) {
      console.error('❌ Failed to send data:', error);
      throw error;
    }
  }

  /**
   * Set up room event listeners
   */
  private setupRoomEvents(): void {
    if (!this.room) return;

    // Connection state
    this.room.on(RoomEvent.Connected, () => {
      console.log('🎉 LiveKit room connected');
      this.notifyStatus('Connected');
    });

    this.room.on(RoomEvent.Disconnected, () => {
      console.log('👋 LiveKit room disconnected');
      this.isConnected = false;
      this.notifyStatus('Disconnected');
    });

    // Data received
    this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        const message: LiveKitMessage = JSON.parse(text);
        
        this.messageCallbacks.forEach(cb => cb(message));
        console.log('📨 Data received from LiveKit:', message.type);
      } catch (error) {
        console.error('Failed to parse data:', error);
      }
    });

    // Track subscribed
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('🎥 Track subscribed:', track.kind);
    });

    // Connection quality
    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      console.log('📊 Connection quality:', quality);
    });
  }

  /**
   * Subscribe to messages
   */
  onMessage(callback: (message: LiveKitMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to status updates
   */
  onStatus(callback: (status: string) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify status callbacks
   */
  private notifyStatus(status: string): void {
    this.statusCallbacks.forEach(cb => cb(status));
  }

  /**
   * Get current room
   */
  getRoom(): Room | null {
    return this.room;
  }

  /**
   * Check if connected
   */
  isRoomConnected(): boolean {
    return this.isConnected && this.room !== null;
  }

  /**
   * Disconnect from room
   */
  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.isConnected = false;
      this.notifyStatus('Disconnected');
      console.log('👋 Disconnected from LiveKit');
    }
  }

  /**
   * Generate client token (simplified - use backend in production!)
   */
  private generateClientToken(roomName: string, participantName: string): string {
    // TEMPORARY: For demo purposes
    // In production, call your backend API to generate token with proper JWT
    const payload = {
      room: roomName,
      identity: participantName,
      name: participantName,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    // This is a simplified token - use proper JWT in production
    return btoa(JSON.stringify(payload));
  }
}

// Singleton instance
export const liveKitRoomService = new LiveKitRoomService();

/**
 * Quick connect helper
 */
export async function connectToLiveKit(
  roomName: string = 'medshare-scanner',
  participantName: string = 'user-' + Math.random().toString(36).substr(2, 9)
): Promise<Room> {
  return await liveKitRoomService.connect(roomName, participantName);
}

/**
 * Publish webcam to LiveKit
 */
export async function publishWebcamToLiveKit(stream: MediaStream): Promise<void> {
  await liveKitRoomService.publishVideo(stream);
}

/**
 * Send scan request through LiveKit
 */
export async function sendScanRequest(imageData: string): Promise<void> {
  await liveKitRoomService.sendData({
    type: 'scan_request',
    data: { image: imageData },
    timestamp: Date.now(),
  });
}

/**
 * Disconnect from LiveKit
 */
export async function disconnectFromLiveKit(): Promise<void> {
  await liveKitRoomService.disconnect();
}
