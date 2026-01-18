#!/usr/bin/env node
/**
 * Demo Data Loader for MedShare
 * Populates Supabase with sample inventory data for demo purposes
 */

require('dotenv').config({ path: './development.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sample inventory data for demo
const DEMO_INVENTORY_DATA = [
  {
    medicine_id_ndc: '00409-4676-01',
    generic_medicine_name: 'Propofol',
    brand_name: 'Diprivan',
    form_of_distribution: 'vial',
    currentOnHandUnits: 70,
    minimumStockLevel: 20,
    averageDailyUse: 2.5,
    lot_number: 'LOT2024A001',
    expiration_date: '2026-02-07',
    unitCost: 60,
    days_until_expiry: 20,
    is_anomaly: false,
    currently_backordered: false,
    date: new Date().toISOString().split('T')[0],
  },
  {
    medicine_id_ndc: '00409-1105-01',
    generic_medicine_name: 'Atropine',
    brand_name: 'AtroPen',
    form_of_distribution: 'vial',
    currentOnHandUnits: 30,
    minimumStockLevel: 10,
    averageDailyUse: 1.2,
    lot_number: 'LOT2024A002',
    expiration_date: '2026-01-31',
    unitCost: 20,
    days_until_expiry: 13,
    is_anomaly: true,
    currently_backordered: false,
    date: new Date().toISOString().split('T')[0],
  },
  {
    medicine_id_ndc: '00409-6629-01',
    generic_medicine_name: 'Succinylcholine',
    brand_name: 'Anectine',
    form_of_distribution: 'vial',
    currentOnHandUnits: 40,
    minimumStockLevel: 15,
    averageDailyUse: 1.8,
    lot_number: 'LOT2024C001',
    expiration_date: '2026-02-21',
    unitCost: 30,
    days_until_expiry: 34,
    is_anomaly: false,
    currently_backordered: false,
    date: new Date().toISOString().split('T')[0],
  },
  {
    medicine_id_ndc: '00409-2820-01',
    generic_medicine_name: 'Epinephrine',
    brand_name: 'Adrenalin',
    form_of_distribution: 'vial',
    currentOnHandUnits: 5,
    minimumStockLevel: 25,
    averageDailyUse: 3.5,
    lot_number: 'LOT2024E001',
    expiration_date: '2025-12-15',
    unitCost: 45,
    days_until_expiry: 45,
    is_anomaly: true,
    currently_backordered: true,
    date: new Date().toISOString().split('T')[0],
  },
  {
    medicine_id_ndc: '00409-6648-01',
    generic_medicine_name: 'Fentanyl',
    brand_name: 'Sublimaze',
    form_of_distribution: 'vial',
    currentOnHandUnits: 60,
    minimumStockLevel: 30,
    averageDailyUse: 2.8,
    lot_number: 'LOT2024F001',
    expiration_date: '2026-03-10',
    unitCost: 75,
    days_until_expiry: 62,
    is_anomaly: false,
    currently_backordered: false,
    date: new Date().toISOString().split('T')[0],
  },
  {
    medicine_id_ndc: '00409-3321-01',
    generic_medicine_name: 'Midazolam',
    brand_name: 'Versed',
    form_of_distribution: 'vial',
    currentOnHandUnits: 45,
    minimumStockLevel: 20,
    averageDailyUse: 1.9,
    lot_number: 'LOT2024M001',
    expiration_date: '2026-01-25',
    unitCost: 35,
    days_until_expiry: 8,
    is_anomaly: false,
    currently_backordered: false,
    date: new Date().toISOString().split('T')[0],
  },
  {
    medicine_id_ndc: '00409-1201-01',
    generic_medicine_name: 'Morphine',
    brand_name: 'Duramorph',
    form_of_distribution: 'vial',
    currentOnHandUnits: 12,
    minimumStockLevel: 30,
    averageDailyUse: 4.2,
    lot_number: 'LOT2024M002',
    expiration_date: '2025-11-30',
    unitCost: 55,
    days_until_expiry: 15,
    is_anomaly: true,
    currently_backordered: true,
    date: new Date().toISOString().split('T')[0],
  },
  {
    medicine_id_ndc: '00409-7246-01',
    generic_medicine_name: 'Rocuronium',
    brand_name: 'Zemuron',
    form_of_distribution: 'vial',
    currentOnHandUnits: 55,
    minimumStockLevel: 25,
    averageDailyUse: 2.1,
    lot_number: 'LOT2024R001',
    expiration_date: '2026-04-15',
    unitCost: 48,
    days_until_expiry: 98,
    is_anomaly: false,
    currently_backordered: false,
    date: new Date().toISOString().split('T')[0],
  },
];

async function checkConnection() {
  console.log('🔍 Testing Supabase connection...');
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('❌ Connection error:', error.message);
      return false;
    }

    console.log('✅ Connected to Supabase successfully!');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function loadDemoData(clearExisting = false) {
  console.log('\n📦 Loading demo inventory data...');
  
  try {
    // Optionally clear existing data
    if (clearExisting) {
      console.log('🗑️  Clearing existing inventory data...');
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('⚠️  Warning: Could not clear existing data:', deleteError.message);
      } else {
        console.log('✓ Existing data cleared');
      }
    }

    // Insert demo data
    console.log(`📝 Inserting ${DEMO_INVENTORY_DATA.length} demo records...`);
    const { data, error } = await supabase
      .from('inventory')
      .insert(DEMO_INVENTORY_DATA)
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully loaded ${data.length} records!`);
    console.log('\n📊 Demo Data Summary:');
    console.log(`   - Total Items: ${data.length}`);
    console.log(`   - Low Stock: ${data.filter(i => i.currentOnHandUnits < i.minimumStockLevel).length}`);
    console.log(`   - Backordered: ${data.filter(i => i.currently_backordered).length}`);
    console.log(`   - With Anomalies: ${data.filter(i => i.is_anomaly).length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to load demo data:', error.message);
    return false;
  }
}

async function checkExistingData() {
  console.log('\n🔍 Checking existing inventory data...');
  
  try {
    const { data, error, count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' });

    if (error) throw error;

    console.log(`✓ Found ${count || 0} existing records`);
    return count || 0;
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    return -1;
  }
}

async function main() {
  console.log('🚀 MedShare Demo Data Loader');
  console.log('============================\n');

  // Test connection
  const connected = await checkConnection();
  if (!connected) {
    console.error('\n❌ Cannot proceed without database connection');
    console.error('Please check your SUPABASE_URL and SUPABASE_ANON_KEY in development.env');
    process.exit(1);
  }

  // Check existing data
  const existingCount = await checkExistingData();
  
  if (existingCount > 0) {
    console.log('\n⚠️  Warning: Inventory table already contains data');
    console.log('Options:');
    console.log('  1. Keep existing data and add demo data');
    console.log('  2. Clear existing data and load demo data');
    console.log('  3. Skip loading demo data');
    console.log('\nTo clear and reload, run:');
    console.log('  node load-demo-data.js --clear');
    
    // Check if --clear flag is provided
    if (process.argv.includes('--clear')) {
      console.log('\n🗑️  Clearing mode activated...');
      await loadDemoData(true);
    } else {
      console.log('\n➕ Adding demo data to existing records...');
      await loadDemoData(false);
    }
  } else {
    await loadDemoData(false);
  }

  console.log('\n✅ Demo data loader complete!');
  console.log('\n🎯 Next steps:');
  console.log('  1. Start the backend: cd express_backend && npm start');
  console.log('  2. Start the frontend: cd frontend && npm run dev');
  console.log('  3. Open http://localhost:5173 in your browser\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
