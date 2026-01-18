const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const credentialsMissing = !SUPABASE_URL || !SUPABASE_ANON_KEY;

if (credentialsMissing) {
  console.log('ℹ️  Supabase: Running in demo mode with mock data');
}

// Only create client if credentials are available
const supabase = credentialsMissing
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  if (!supabase) {
    // Silently return false in demo mode
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log('⚠️  Supabase connection error:', error.message);
      return false;
    }
    console.log('✅ Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.log('⚠️  Supabase connection failed:', error.message);
    return false;
  }
}

module.exports = { supabase, testConnection };
