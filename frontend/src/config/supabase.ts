/**
 * Supabase Client Configuration
 * Direct database access from frontend (optional - for real-time features)
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are available and valid
const credentialsAvailable = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
  SUPABASE_ANON_KEY.startsWith('eyJ') // JWT tokens start with eyJ
);

// Create Supabase client (or null if not configured)
export const supabase = credentialsAvailable
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Log configuration status
if (!credentialsAvailable && import.meta.env.DEV) {
  console.log('ℹ️ Supabase not configured - using backend API only');
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return credentialsAvailable;
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }

    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

// Initialize connection test (optional)
if (import.meta.env.DEV && credentialsAvailable) {
  testSupabaseConnection();
}

// Database types (for TypeScript)
export type InventoryItem = {
  id: string;
  medicine_id_ndc: string;
  generic_medicine_name: string;
  brand_name?: string;
  form_of_distribution?: string;
  currentOnHandUnits: number;
  minimumStockLevel?: number;
  averageDailyUse?: number;
  lot_number?: string;
  expiration_date?: string;
  unitCost?: number;
  days_until_expiry?: number;
  is_anomaly: boolean;
  currently_backordered: boolean;
  date: string;
  created_at?: string;
  updated_at?: string;
};

export type HospitalProfile = {
  id: string;
  hospital_name: string;
  address?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  created_at?: string;
  updated_at?: string;
};
