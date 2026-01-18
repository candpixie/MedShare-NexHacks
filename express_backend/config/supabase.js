const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const credentialsMissing = !SUPABASE_URL || !SUPABASE_ANON_KEY;

if (credentialsMissing) {
  console.error('Missing Supabase credentials in environment variables');
  console.error('  SUPABASE_URL:', SUPABASE_URL ? 'set' : 'MISSING');
  console.error('  SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'set' : 'MISSING');
  console.error('');
  console.error('To fix this, create a .env file in express_backend/ with:');
  console.error('  SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('  SUPABASE_ANON_KEY=your-anon-public-key');
  console.error('');
  console.error('See .env.example for a template.');
}

// Only create client if credentials are available
const supabase = credentialsMissing
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  if (!supabase) {
    console.error('Supabase client not initialized - credentials missing');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    console.log('Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

module.exports = { supabase, testConnection };
