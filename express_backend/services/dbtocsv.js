const { supabase } = require('../config/supabase');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

/**
 * Export data from Supabase table to CSV file
 * @param {string} tableName - Supabase table name
 * @param {string} outputPath - Path where CSV file will be saved
 * @param {Object} options - Export options
 * @param {Object} options.filters - Filters to apply to query (e.g., { status: 'active' })
 * @param {Array} options.columns - Specific columns to export (default: all)
 * @param {string} options.orderBy - Column to order by
 * @param {boolean} options.ascending - Sort order (default: true)
 * @param {number} options.limit - Limit number of rows
 * @returns {Promise<Object>} Export result
 */
async function exportTableToCSV(tableName, outputPath, options = {}) {
  try {
    const {
      filters = {},
      columns = null,
      orderBy = null,
      ascending = true,
      limit = null
    } = options;

    console.log(`📥 Fetching data from table: ${tableName}`);
    
    // Build query
    let query = supabase.from(tableName).select(columns ? columns.join(',') : '*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('No data found to export');
      return {
        success: false,
        exported: 0,
        message: 'No data found to export'
      };
    }
    
    console.log(`Fetched ${data.length} rows`);
    
    // Convert to CSV
    const csv = Papa.unparse(data, {
      header: true,
      skipEmptyLines: true
    });
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(outputPath, csv, 'utf8');
    
    console.log(`✅ Exported ${data.length} rows to: ${outputPath}`);
    
    return {
      success: true,
      exported: data.length,
      filePath: outputPath,
      message: `Successfully exported ${data.length} rows to ${path.basename(outputPath)}`
    };
    
  } catch (error) {
    console.error('Export failed:', error.message);
    return {
      success: false,
      exported: 0,
      error: error.message
    };
  }
}

/**
 * Export inventory data with advanced filtering
 * @param {string} outputPath - Path where CSV file will be saved
 * @param {Object} options - Export options
 * @param {Date} options.expiringBefore - Export items expiring before this date
 * @param {number} options.minQuantity - Minimum quantity threshold
 * @param {number} options.maxQuantity - Maximum quantity threshold
 * @param {string} options.drugName - Filter by drug name (partial match)
 * @param {string} options.formType - Filter by form type
 * @returns {Promise<Object>} Export result
 */
async function exportInventoryToCSV(outputPath, options = {}) {
  try {
    const {
      expiringBefore = null,
      minQuantity = null,
      maxQuantity = null,
      drugName = null,
      formType = null,
      orderBy = 'created_at',
      ascending = false
    } = options;

    console.log(`📥 Fetching inventory data with filters...`);
    
    let query = supabase.from('inventory').select('*');
    
    // Apply filters
    if (expiringBefore) {
      query = query.lte('expiration_date', expiringBefore);
    }
    
    if (minQuantity !== null) {
      query = query.gte('quantity', minQuantity);
    }
    
    if (maxQuantity !== null) {
      query = query.lte('quantity', maxQuantity);
    }
    
    if (drugName) {
      query = query.ilike('drug_name', `%${drugName}%`);
    }
    
    if (formType) {
      query = query.eq('form_type', formType);
    }
    
    // Apply ordering
    query = query.order(orderBy, { ascending });
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('No inventory data found to export');
      return {
        success: false,
        exported: 0,
        message: 'No inventory data found matching the criteria'
      };
    }
    
    console.log(`Fetched ${data.length} inventory rows`);
    
    // Convert to CSV
    const csv = Papa.unparse(data, {
      header: true,
      skipEmptyLines: true,
      columns: [
        'id',
        'ndc_code',
        'drug_name',
        'form_type',
        'quantity',
        'lot_number',
        'expiration_date',
        'unit_cost',
        'par_level',
        'daily_usage',
        'created_at',
        'updated_at'
      ]
    });
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(outputPath, csv, 'utf8');
    
    console.log(`✅ Exported ${data.length} inventory rows to: ${outputPath}`);
    
    return {
      success: true,
      exported: data.length,
      filePath: outputPath,
      message: `Successfully exported ${data.length} inventory rows`
    };
    
  } catch (error) {
    console.error('Inventory export failed:', error.message);
    return {
      success: false,
      exported: 0,
      error: error.message
    };
  }
}

/**
 * Export low stock items (below par level)
 * @param {string} outputPath - Path where CSV file will be saved
 * @returns {Promise<Object>} Export result
 */
async function exportLowStockToCSV(outputPath) {
  try {
    console.log(`📥 Fetching low stock items...`);
    
    // Query items where quantity is below par_level
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .not('par_level', 'is', null)
      .filter('quantity', 'lt', 'par_level')
      .order('quantity', { ascending: true });
    
    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('No low stock items found');
      return {
        success: true,
        exported: 0,
        message: 'No low stock items found (all items at or above par level)'
      };
    }
    
    console.log(`Found ${data.length} low stock items`);
    
    // Add computed field for deficit
    const enrichedData = data.map(item => ({
      ...item,
      deficit: item.par_level - item.quantity,
      deficit_percentage: ((item.par_level - item.quantity) / item.par_level * 100).toFixed(2)
    }));
    
    const csv = Papa.unparse(enrichedData, {
      header: true,
      skipEmptyLines: true
    });
    
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, csv, 'utf8');
    
    console.log(`✅ Exported ${data.length} low stock items to: ${outputPath}`);
    
    return {
      success: true,
      exported: data.length,
      filePath: outputPath,
      message: `Successfully exported ${data.length} low stock items`
    };
    
  } catch (error) {
    console.error('Low stock export failed:', error.message);
    return {
      success: false,
      exported: 0,
      error: error.message
    };
  }
}

/**
 * Export expiring items (within specified days)
 * @param {string} outputPath - Path where CSV file will be saved
 * @param {number} daysAhead - Number of days to look ahead (default: 30)
 * @returns {Promise<Object>} Export result
 */
async function exportExpiringItemsToCSV(outputPath, daysAhead = 30) {
  try {
    console.log(`📥 Fetching items expiring within ${daysAhead} days...`);
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .gte('expiration_date', today.toISOString().split('T')[0])
      .lte('expiration_date', futureDate.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true });
    
    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log(`No items expiring within ${daysAhead} days`);
      return {
        success: true,
        exported: 0,
        message: `No items expiring within ${daysAhead} days`
      };
    }
    
    console.log(`Found ${data.length} expiring items`);
    
    // Add days until expiration
    const enrichedData = data.map(item => {
      const expDate = new Date(item.expiration_date);
      const daysUntilExp = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      return {
        ...item,
        days_until_expiration: daysUntilExp
      };
    });
    
    const csv = Papa.unparse(enrichedData, {
      header: true,
      skipEmptyLines: true
    });
    
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, csv, 'utf8');
    
    console.log(`✅ Exported ${data.length} expiring items to: ${outputPath}`);
    
    return {
      success: true,
      exported: data.length,
      filePath: outputPath,
      message: `Successfully exported ${data.length} items expiring within ${daysAhead} days`
    };
    
  } catch (error) {
    console.error('Expiring items export failed:', error.message);
    return {
      success: false,
      exported: 0,
      error: error.message
    };
  }
}

/**
 * Export query results to CSV using custom SQL
 * @param {string} query - SQL query to execute
 * @param {string} outputPath - Path where CSV file will be saved
 * @returns {Promise<Object>} Export result
 */
async function exportCustomQueryToCSV(query, outputPath) {
  try {
    console.log(`📥 Executing custom query...`);
    
    const { data, error } = await supabase.rpc('execute_custom_query', { 
      query_text: query 
    });
    
    if (error) {
      throw new Error(`Query execution error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('Query returned no results');
      return {
        success: false,
        exported: 0,
        message: 'Query returned no results'
      };
    }
    
    console.log(`Query returned ${data.length} rows`);
    
    const csv = Papa.unparse(data, {
      header: true,
      skipEmptyLines: true
    });
    
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, csv, 'utf8');
    
    console.log(`✅ Exported ${data.length} rows to: ${outputPath}`);
    
    return {
      success: true,
      exported: data.length,
      filePath: outputPath,
      message: `Successfully exported ${data.length} rows from custom query`
    };
    
  } catch (error) {
    console.error('Custom query export failed:', error.message);
    return {
      success: false,
      exported: 0,
      error: error.message
    };
  }
}

/**
 * Batch export multiple tables
 * @param {Array} tableNames - Array of table names to export
 * @param {string} outputDir - Directory where CSV files will be saved
 * @returns {Promise<Object>} Batch export result
 */
async function batchExportTables(tableNames, outputDir) {
  try {
    console.log(`📦 Starting batch export of ${tableNames.length} tables...`);
    
    const results = [];
    let totalExported = 0;
    
    for (const tableName of tableNames) {
      const outputPath = path.join(outputDir, `${tableName}_export_${Date.now()}.csv`);
      const result = await exportTableToCSV(tableName, outputPath);
      
      results.push({
        table: tableName,
        ...result
      });
      
      if (result.success) {
        totalExported += result.exported;
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Batch export complete: ${successCount} succeeded, ${failureCount} failed`);
    
    return {
      success: failureCount === 0,
      totalTables: tableNames.length,
      successfulExports: successCount,
      failedExports: failureCount,
      totalRowsExported: totalExported,
      results: results,
      message: `Exported ${totalExported} total rows from ${successCount}/${tableNames.length} tables`
    };
    
  } catch (error) {
    console.error('Batch export failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  exportTableToCSV,
  exportInventoryToCSV,
  exportLowStockToCSV,
  exportExpiringItemsToCSV,
  exportCustomQueryToCSV,
  batchExportTables
};
