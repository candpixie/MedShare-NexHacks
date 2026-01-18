const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(' Missing Supabase credentials in environment variables');
  console.error(' SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error(' SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    const { data, error, count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    console.log(' Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.error(' Supabase connection failed:', error);
    return false;
  }
}

module.exports = { supabase, testConnection };
