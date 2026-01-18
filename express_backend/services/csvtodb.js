const { supabase } = require('../config/supabase');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

/**
 * Parse CSV file and return data as array of objects
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Parsed CSV data
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
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
  const requiredFields = [
    'ndc_code',
    'drug_name',
    'form_type',
    'quantity',
    'lot_number',
    'expiration_date',
    'unit_cost'
  ];

  const errors = [];
  const validData = [];

  data.forEach((row, index) => {
    const missingFields = requiredFields.filter(field => !row[field] && row[field] !== 0);
    
    if (missingFields.length > 0) {
      errors.push({
        row: index + 2, // +2 because index is 0-based and header is row 1
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: row
      });
    } else {
      // Transform and sanitize data to match Supabase schema
      validData.push({
        ndc_code: String(row.ndc_code).trim(),
        drug_name: String(row.drug_name).trim(),
        form_type: String(row.form_type).trim(),
        quantity: parseInt(row.quantity) || 0,
        lot_number: String(row.lot_number).trim(),
        expiration_date: row.expiration_date,
        unit_cost: parseFloat(row.unit_cost) || 0,
        par_level: parseInt(row.par_level) || 0,
        daily_usage: parseFloat(row.daily_usage) || 0,
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
async function uploadCSVToSupabase(filePath, tableName = 'inventory') {
  try {
    console.log(`Parsing CSV file: ${filePath}`);
    const parsedData = await parseCSV(filePath);
    
    console.log(`Parsed ${parsedData.length} rows`);
    console.log(`Validating data...`);
    const { validData, errors } = validateInventoryData(parsedData);

    if (errors.length > 0) {
      console.warn(`Validation warnings for ${errors.length} rows:`);
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
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${data.length} rows inserted`);
    }

    console.log(`Upload complete: ${totalInserted} records inserted`);

    return {
      success: true,
      uploaded: totalInserted,
      validationErrors: errors,
      message: `Successfully uploaded ${totalInserted} records`,
      data: results
    };

  } catch (error) {
    console.error('Upload failed:', error.message);
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
async function updateInventoryFromCSV(filePath, tableName = 'inventory') {
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

    // strict formating to avoid unknown column format
    for (const record of validData) {
      const { data, error } = await supabase
        .from(tableName)
        .update({
          drug_name: record.drug_name,
          form_type: record.form_type,
          quantity: record.quantity,
          expiration_date: record.expiration_date,
          unit_cost: record.unit_cost,
          par_level: record.par_level,
          daily_usage: record.daily_usage,
          updated_at: new Date().toISOString()
        })
        .eq('ndc_code', record.ndc_code)
        .eq('lot_number', record.lot_number)
        .select();

      if (error) {
        throw new Error(`Update error: ${error.message}`);
      }

      if (data.length === 0) {
        notFound.push({
          ndc_code: record.ndc_code,
          lot_number: record.lot_number
        });
      } else {
        results.push(...data);
        updateCount++;
      }
    }

    console.log(`Update complete: ${updateCount} records updated, ${notFound.length} not found`);

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
    console.error('Update failed:', error.message);
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
async function upsertInventoryFromCSV(filePath, tableName = 'inventory') {
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
          onConflict: 'ndc_code,lot_number',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        throw new Error(`Upsert error: ${error.message}`);
      }

      totalUpserted += data.length;
      results.push(...data);
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${data.length} rows upserted`);
    }

    console.log(`Upsert complete: ${totalUpserted} records processed`);

    return {
      success: true,
      upserted: totalUpserted,
      validationErrors: errors,
      message: `Successfully upserted ${totalUpserted} records`,
      data: results
    };

  } catch (error) {
    console.error('Upsert failed:', error.message);
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
async function deleteInventoryFromCSV(filePath, tableName = 'inventory') {
  try {
    console.log(`Parsing CSV file: ${filePath}`);
    const parsedData = await parseCSV(filePath);
    let deletedCount = 0;
    const notFound = [];

    console.log(`Deleting ${parsedData.length} records...`);

    for (const record of parsedData) {
      if (!record.ndc_code || !record.lot_number) {
        console.warn(`Skipping row - missing ndc_code or lot_number`);
        continue;
      }

      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('ndc_code', record.ndc_code)
        .eq('lot_number', record.lot_number)
        .select();

      if (error) {
        throw new Error(`Delete error: ${error.message}`);
      }

      if (data.length === 0) {
        notFound.push({
          ndc_code: record.ndc_code,
          lot_number: record.lot_number
        });
      } else {
        deletedCount += data.length;
      }
    }

    console.log(`Delete complete: ${deletedCount} records deleted, ${notFound.length} not found`);

    return {
      success: true,
      deleted: deletedCount,
      notFound: notFound.length,
      notFoundRecords: notFound,
      message: `Deleted ${deletedCount} records, ${notFound.length} not found`
    };

  } catch (error) {
    console.error('Delete failed:', error.message);
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
async function getCSVSummary(filePath) {
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

module.exports = {
  parseCSV,
  validateInventoryData,
  uploadCSVToSupabase,
  updateInventoryFromCSV,
  upsertInventoryFromCSV,
  deleteInventoryFromCSV,
  getCSVSummary
};