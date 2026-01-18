const { supabase } = require('../config/supabase');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

/**
 * Parse CSV file and return data as array of objects
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Parsed CSV data
 */
async function parseCSV(filePath='/Users/paif_iris/Downloads/MedShare-NexHacks/daily_inventory.csv') {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim().toLowerCase().replace(/ /g, '_'),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * Validate medication inventory data
 * @param {Array} data - Parsed CSV data
 * @returns {Object} Validation result with validData and errors
 */
function validateInventoryData(data) {
  // Match the actual CSV columns from daily_inventory.csv
  const requiredFields = [
    'medicine_id_ndc',
    'generic_medicine_name',
    'ending_inventory_units'
  ];

  const errors = [];
  const validData = [];

  data.forEach((row, index) => {
    // Check if required fields exist and are not empty
    const missingFields = requiredFields.filter(field => {
      const value = row[field];
      return value === null || value === undefined || value === '';
    });
    
    if (missingFields.length > 0) {
      errors.push({
        row: index + 2,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: row
      });
    } else {
      // Transform CSV data to Supabase inventory schema
      validData.push({
        medicine_id_ndc: String(row.medicine_id_ndc).trim(),
        year_month: row.year_month ? String(row.year_month).trim() : null,
        generic_medicine_name: String(row.generic_medicine_name).trim(),
        brand_name: row.brand_name ? String(row.brand_name).trim() : null,
        manufacturer_name: row.manufacturer_name ? String(row.manufacturer_name).trim() : null,
        dosage_amount: row.dosage_amount ? parseFloat(row.dosage_amount) : null,
        dosage_unit: row.dosage_unit ? String(row.dosage_unit).trim() : null,
        medication_form: row.medication_form ? String(row.medication_form).trim() : null,
        order_unit_description: row.order_unit_description ? String(row.order_unit_description).trim() : null,
        units_per_order_unit: row.units_per_order_unit ? parseInt(row.units_per_order_unit) : null,
        is_order_unit_openable: row.is_order_unit_openable === 'True' || row.is_order_unit_openable === 'true' || row.is_order_unit_openable === true || row.is_order_unit_openable === 1,
        price_per_unit_usd: row.price_per_unit_usd ? parseFloat(row.price_per_unit_usd) : 0,
        beginning_inventory_units: row.beginning_inventory_units ? parseInt(row.beginning_inventory_units) : 0,
        units_received_this_month: row.units_received_this_month ? parseInt(row.units_received_this_month) : 0,
        ending_inventory_units: parseInt(row.ending_inventory_units) || 0,
        restock_events_count: row.restock_events_count ? parseInt(row.restock_events_count) : 0,
        units_used_this_month: row.units_used_this_month ? parseInt(row.units_used_this_month) : 0,
        average_daily_usage_units: row.average_daily_usage_units ? parseFloat(row.average_daily_usage_units) : 0,
        monthly_usage_trend: row.monthly_usage_trend ? String(row.monthly_usage_trend).trim() : null,
        usage_variability_flag: row.usage_variability_flag === 'True' || row.usage_variability_flag === 'true' || row.usage_variability_flag === true || row.usage_variability_flag === 1,
        currently_backordered: row.currently_backordered === 'True' || row.currently_backordered === 'true' || row.currently_backordered === true || row.currently_backordered === 1,
        available_suppliers: row.available_suppliers ? String(row.available_suppliers).trim() : null,
        historically_stocked: row.historically_stocked === 'True' || row.historically_stocked === 'true' || row.historically_stocked === true || row.historically_stocked === 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  });

  return { validData, errors };
}

/**
 * Upload CSV data to Supabase inventory table
 * @param {string} filePath - Path to CSV file
 * @param {string} tableName - Supabase table name (default: 'inventory')
 * @returns {Promise<Object>} Upload result
 */
async function uploadCSVToSupabase(filePath='/Users/paif_iris/Downloads/MedShare-NexHacks/daily_inventory.csv', tableName = 'inventory') {
  try {
    console.log(`Parsing CSV file: ${filePath}`);
    const parsedData = await parseCSV(filePath);
    
    console.log(`Parsed ${parsedData.length} rows`);
    console.log(`Validating data...`);
    const { validData, errors } = validateInventoryData(parsedData);

    if (errors.length > 0) {
      console.warn(`⚠️  Validation warnings for ${errors.length} rows:`);
      errors.slice(0, 5).forEach(err => {
        console.warn(`   Row ${err.row}: ${err.message}`);
      });
      if (errors.length > 5) {
        console.warn(`   ... and ${errors.length - 5} more errors`);
      }
    }

    if (validData.length === 0) {
      throw new Error('No valid data to upload');
    }

    console.log(`📤 Uploading ${validData.length} valid rows to Supabase table: ${tableName}`);
    
    // Insert data in batches (Supabase recommends batches of 100-1000)
    const batchSize = 100;
    const results = [];
    let totalInserted = 0;
    
    for (let i = 0; i < validData.length; i += batchSize) {
      const batch = validData.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from(tableName)
        .insert(batch)
        .select();

      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }
      
      totalInserted += data.length;
      results.push(...data);
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${data.length} rows inserted`);
    }

    console.log(`✨ Upload complete: ${totalInserted} records inserted`);

    return {
      success: true,
      uploaded: totalInserted,
      validationErrors: errors,
      message: `Successfully uploaded ${totalInserted} records`,
      data: results
    };

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    return {
      success: false,
      uploaded: 0,
      error: error.message
    };
  }
}

/**
 * Update existing inventory records from CSV
 * @param {string} filePath - Path to CSV file
 * @param {string} tableName - Supabase table name
 * @returns {Promise<Object>} Update result
 */
async function updateInventoryFromCSV(filePath='/Users/paif_iris/Downloads/MedShare-NexHacks/daily_inventory.csv', tableName = 'inventory') {
  try {
    console.log(`Parsing CSV file: ${filePath}`);
    const parsedData = await parseCSV(filePath);
    const { validData, errors } = validateInventoryData(parsedData);

    if (validData.length === 0) {
      throw new Error('No valid data to update');
    }

    console.log(`Updating ${validData.length} records...`);
    const results = [];
    const notFound = [];
    let updateCount = 0;

    for (const record of validData) {
      const { data, error } = await supabase
        .from(tableName)
        .update({
          year_month: record.year_month,
          brand_name: record.brand_name,
          manufacturer_name: record.manufacturer_name,
          medication_form: record.medication_form,
          dosage_amount: record.dosage_amount,
          dosage_unit: record.dosage_unit,
          order_unit_description: record.order_unit_description,
          units_per_order_unit: record.units_per_order_unit,
          is_order_unit_openable: record.is_order_unit_openable,
          price_per_unit_usd: record.price_per_unit_usd,
          beginning_inventory_units: record.beginning_inventory_units,
          units_received_this_month: record.units_received_this_month,
          ending_inventory_units: record.ending_inventory_units,
          restock_events_count: record.restock_events_count,
          units_used_this_month: record.units_used_this_month,
          average_daily_usage_units: record.average_daily_usage_units,
          monthly_usage_trend: record.monthly_usage_trend,
          usage_variability_flag: record.usage_variability_flag,
          currently_backordered: record.currently_backordered,
          available_suppliers: record.available_suppliers,
          historically_stocked: record.historically_stocked,
          updated_at: new Date().toISOString()
        })
        .eq('medicine_id_ndc', record.medicine_id_ndc)
        .select();

      if (error) {
        throw new Error(`Update error: ${error.message}`);
      }

      if (data.length === 0) {
        notFound.push({
          medicine_id_ndc: record.medicine_id_ndc
        });
      } else {
        results.push(...data);
        updateCount++;
      }
    }

    console.log(`✅ Update complete: ${updateCount} records updated, ${notFound.length} not found`);

    return {
      success: true,
      updated: updateCount,
      notFound: notFound.length,
      notFoundRecords: notFound,
      validationErrors: errors,
      message: `Updated ${updateCount} records, ${notFound.length} not found`,
      data: results
    };

  } catch (error) {
    console.error('❌ Update failed:', error.message);
    return {
      success: false,
      updated: 0,
      error: error.message
    };
  }
}

/**
 * Upsert inventory data (insert or update based on conflict)
 * @param {string} filePath - Path to CSV file
 * @param {string} tableName - Supabase table name
 * @returns {Promise<Object>} Upsert result
 */
async function upsertInventoryFromCSV(filePath='/Users/paif_iris/Downloads/MedShare-NexHacks/daily_inventory.csv', tableName = 'inventory') {
  try {
    console.log(`Parsing CSV file: ${filePath}`);
    const parsedData = await parseCSV(filePath);
    const { validData, errors } = validateInventoryData(parsedData);

    if (validData.length === 0) {
      throw new Error('No valid data to upsert');
    }

    console.log(`🔄 Upserting ${validData.length} records...`);
    const batchSize = 100;
    const results = [];
    let totalUpserted = 0;

    for (let i = 0; i < validData.length; i += batchSize) {
      const batch = validData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from(tableName)
        .upsert(batch, {
          onConflict: 'medicine_id_ndc',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        throw new Error(`Upsert error: ${error.message}`);
      }

      totalUpserted += data.length;
      results.push(...data);
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${data.length} rows upserted`);
    }

    console.log(`✨ Upsert complete: ${totalUpserted} records processed`);

    return {
      success: true,
      upserted: totalUpserted,
      validationErrors: errors,
      message: `Successfully upserted ${totalUpserted} records`,
      data: results
    };

  } catch (error) {
    console.error('❌ Upsert failed:', error.message);
    return {
      success: false,
      upserted: 0,
      error: error.message
    };
  }
}

/**
 * Delete inventory records based on CSV data
 * @param {string} filePath - Path to CSV file containing ndc_code and lot_number
 * @param {string} tableName - Supabase table name
 * @returns {Promise<Object>} Delete result
 */
async function deleteInventoryFromCSV(filePath='/Users/paif_iris/Downloads/MedShare-NexHacks/daily_inventory.csv', tableName = 'inventory') {
  try {
    console.log(`Parsing CSV file: ${filePath}`);
    const parsedData = await parseCSV(filePath);
    let deletedCount = 0;
    const notFound = [];

    console.log(`Deleting ${parsedData.length} records...`);

    for (const record of parsedData) {
      if (!record.medicine_id_ndc) {
        console.warn(`Skipping row - missing medicine_id_ndc`);
        continue;
      }

      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('medicine_id_ndc', record.medicine_id_ndc)
        .select();

      if (error) {
        throw new Error(`Delete error: ${error.message}`);
      }

      if (data.length === 0) {
        notFound.push({
          medicine_id_ndc: record.medicine_id_ndc
        });
      } else {
        deletedCount += data.length;
      }
    }

    console.log(`✅ Delete complete: ${deletedCount} records deleted, ${notFound.length} not found`);

    return {
      success: true,
      deleted: deletedCount,
      notFound: notFound.length,
      notFoundRecords: notFound,
      message: `Deleted ${deletedCount} records, ${notFound.length} not found`
    };

  } catch (error) {
    console.error('❌ Delete failed:', error.message);
    return {
      success: false,
      deleted: 0,
      error: error.message
    };
  }
}

/**
 * Get summary statistics from CSV before uploading
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Object>} CSV summary
 */
async function getCSVSummary(filePath='/Users/paif_iris/Downloads/MedShare-NexHacks/daily_inventory.csv') {
  try {
    const parsedData = await parseCSV(filePath);
    const { validData, errors } = validateInventoryData(parsedData);

    return {
      success: true,
      totalRows: parsedData.length,
      validRows: validData.length,
      invalidRows: errors.length,
      errors: errors,
      preview: validData.slice(0, 5),
      message: `CSV contains ${parsedData.length} rows (${validData.length} valid, ${errors.length} invalid)`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse and load data from CSV - convenience function
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Object>} Result of upsert operation
 */
async function parseAndLoadData(filePath='/Users/paif_iris/Downloads/MedShare-NexHacks/daily_inventory.csv') {
  return upsertInventoryFromCSV(filePath);
}

module.exports = {
  parseCSV,
  validateInventoryData,
  uploadCSVToSupabase,
  updateInventoryFromCSV,
  upsertInventoryFromCSV,
  deleteInventoryFromCSV,
  getCSVSummary,
  parseAndLoadData
};