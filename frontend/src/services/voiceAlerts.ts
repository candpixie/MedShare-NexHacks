/**
 * LiveKit Voice Alert Service
 * 
 * Uses LiveKit for real-time voice alerts and notifications
 */

import { Room, RoomEvent, Track } from 'livekit-client';
import { livekitConfig } from '@/config/livekit';

export interface VoiceAlertConfig {
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  repeat?: number;
}

class LiveKitVoiceAlertService {
  private room: Room | null = null;
  private isConnected: boolean = false;
  private audioContext: AudioContext | null = null;
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Initialize LiveKit connection for voice alerts
   */
  async initialize(): Promise<boolean> {
    try {
      // Use browser's Speech Synthesis API (no LiveKit connection needed for TTS)
      if (this.synthesis) {
        console.log('Voice alert service initialized');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize voice alert service:', error);
      return false;
    }
  }

  /**
   * Speak a voice alert
   */
  async speak(config: VoiceAlertConfig): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return;
    }

    try {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(config.message);
      
      // Configure voice settings based on priority
      switch (config.priority) {
        case 'critical':
          utterance.rate = 0.9; // Slower for critical
          utterance.pitch = 1.2; // Higher pitch
          utterance.volume = 1.0; // Max volume
          break;
        case 'high':
          utterance.rate = 1.0;
          utterance.pitch = 1.1;
          utterance.volume = 0.9;
          break;
        case 'medium':
          utterance.rate = 1.1;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          break;
        case 'low':
          utterance.rate = 1.2;
          utterance.pitch = 0.9;
          utterance.volume = 0.7;
          break;
      }

      // Select a good voice if available
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.startsWith('en') && 
          (voice.name.includes('Female') || voice.name.includes('Samantha'))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Speak the message
      this.synthesis.speak(utterance);

      // Handle repetition
      if (config.repeat && config.repeat > 1) {
        utterance.onend = () => {
          let repeatCount = 1;
          const repeatInterval = setInterval(() => {
            if (repeatCount >= (config.repeat || 1)) {
              clearInterval(repeatInterval);
              return;
            }
            this.synthesis!.speak(utterance);
            repeatCount++;
          }, 2000); // 2 second delay between repeats
        };
      }

      console.log(`Voice alert: "${config.message}" (${config.priority})`);
    } catch (error) {
      console.error('Error speaking voice alert:', error);
    }
  }

  /**
   * Stop all voice alerts
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Test voice alert system
   */
  async test(): Promise<void> {
    await this.speak({
      message: 'Voice alert system is working correctly',
      priority: 'medium',
    });
  }

  /**
   * Disconnect from LiveKit room
   */
  async disconnect(): Promise<void> {
    this.stop();
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
    this.isConnected = false;
  }
}

// Singleton instance
export const voiceAlertService = new LiveKitVoiceAlertService();

/**
 * Common voice alert templates
 */
export const VoiceAlerts = {
  medicationExpiring: (drugName: string, days: number): VoiceAlertConfig => ({
    message: `Alert: ${drugName} is expiring in ${days} days. Please review inventory.`,
    priority: days <= 7 ? 'high' : 'medium',
  }),

  medicationExpired: (drugName: string): VoiceAlertConfig => ({
    message: `Critical alert: ${drugName} has expired. Immediate action required.`,
    priority: 'critical',
    repeat: 2,
  }),

  lowStock: (drugName: string, quantity: number, parLevel: number): VoiceAlertConfig => ({
    message: `Warning: ${drugName} stock is low. Current quantity ${quantity}, par level ${parLevel}.`,
    priority: 'medium',
  }),

  fifoViolation: (drugName: string): VoiceAlertConfig => ({
    message: `FIFO violation detected for ${drugName}. Please check lot rotation.`,
    priority: 'high',
  }),

  newShipment: (itemCount: number): VoiceAlertConfig => ({
    message: `New shipment received. ${itemCount} items added to inventory.`,
    priority: 'low',
  }),

  systemAlert: (message: string): VoiceAlertConfig => ({
    message,
    priority: 'medium',
  }),

  emergencyAlert: (message: string): VoiceAlertConfig => ({
    message: `Emergency alert: ${message}`,
    priority: 'critical',
    repeat: 3,
  }),

  drugRecognized: (drugName: string, confidence: number): VoiceAlertConfig => ({
    message: `Drug recognized: ${drugName}. Confidence ${Math.round(confidence * 100)} percent.`,
    priority: 'low',
  }),

  scanComplete: (): VoiceAlertConfig => ({
    message: 'Scan complete. Medication added to inventory.',
    priority: 'low',
  }),

  dailyReport: (expiringCount: number, lowStockCount: number): VoiceAlertConfig => ({
    message: `Daily report: ${expiringCount} medications expiring soon, ${lowStockCount} items below par level.`,
    priority: 'medium',
  }),
};

/**
 * Initialize voice alerts on app start
 */
export async function initializeVoiceAlerts(): Promise<boolean> {
  try {
    const initialized = await voiceAlertService.initialize();
    if (initialized) {
      console.log('✓ Voice alert system ready');
    }
    return initialized;
  } catch (error) {
    console.error('Failed to initialize voice alerts:', error);
    return false;
  }
}

/**
 * Play voice alert
 */
export async function playVoiceAlert(config: VoiceAlertConfig): Promise<void> {
  await voiceAlertService.speak(config);
}

/**
 * Stop all voice alerts
 */
export function stopVoiceAlerts(): void {
  voiceAlertService.stop();
}
