#!/usr/bin/env node
/**
 * Test Supabase Connection
 */

require('dotenv').config({ path: './development.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('================================\n');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing');
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('📡 Connecting to Supabase...');
    
    const { data, error, count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (error) {
      console.error('❌ Database Error:', error.message);
      console.error('Details:', error);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log(`📊 Found ${count} total records in inventory table`);
    
    if (data && data.length > 0) {
      console.log('\n📦 Sample data (first 3 records):');
      data.forEach((item, idx) => {
        console.log(`\n${idx + 1}. ${item.generic_medicine_name}`);
        console.log(`   NDC: ${item.medicine_id_ndc}`);
        console.log(`   Stock: ${item.currentOnHandUnits || item.current_on_hand_units || 'N/A'}`);
        console.log(`   Status: ${item.currently_backordered ? '⚠️ Backordered' : '✓ In Stock'}`);
      });
    } else {
      console.log('\n⚠️  No data found in inventory table');
      console.log('Run: node load-demo-data.js to populate with sample data');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Full error:', err);
    return false;
  }
}

async function testTables() {
  console.log('\n\n🔍 Checking available tables...');
  
  try {
    // Try to query different tables
    const tables = ['inventory', 'hospital_profile', 'user_profile'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ✗ ${table}: ${error.message}`);
        } else {
          console.log(`  ✓ ${table}: ${count || 0} records`);
        }
      } catch (e) {
        console.log(`  ✗ ${table}: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Error checking tables:', err.message);
  }
}

async function main() {
  const connected = await testConnection();
  
  if (connected) {
    await testTables();
    
    console.log('\n✅ All tests passed!');
    console.log('\n🚀 You can now start the application:');
    console.log('   npm start');
  } else {
    console.log('\n❌ Connection test failed');
    console.log('Please check your Supabase credentials in development.env');
    process.exit(1);
  }
}

main();
