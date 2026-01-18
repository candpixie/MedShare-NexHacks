const { supabase } = require('./config/supabase');

async function checkSchema() {
  try {
    // Get table information from information_schema
    const { data, error } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('Error:', error.message);
      return;
    }

    console.log('Columns in inventory table:');
    console.log(Object.keys(data[0] || {}));
    
  } catch (error) {
    console.error('Error checking schema:', error.message);
  }
}

checkSchema();
