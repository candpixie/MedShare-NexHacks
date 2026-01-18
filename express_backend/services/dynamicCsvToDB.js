const { supabase } = require('../config/supabase');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

/**
 * Auto-detect database schema for a table
 * @param {string} tableName - Table name
 * @returns {Promise<Object>} Schema information
 */
async function detectTableSchema(tableName) {
  try {
    // Fetch one row to understand the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(`Schema detection error: ${error.message}`);
    }

    // If table is empty, we can't auto-detect - return basic info
    if (!data || data.length === 0) {
      console.warn(`Table '${tableName}' is empty. Using basic schema detection.`);
      return { columns: [], isEmpty: true };
    }

    const sampleRow = data[0];
    const columns = Object.keys(sampleRow).map(col => ({
      name: col,
      type: typeof sampleRow[col],
      nullable: sampleRow[col] === null
    }));

    return { columns, isEmpty: false, sample: sampleRow };
  } catch (error) {
    throw new Error(`Failed to detect schema: ${error.message}`);
  }
}

/**
 * Create intelligent column mapping between CSV headers and database columns
 * @param {Array} csvHeaders - Headers from CSV file
 * @param {Array} dbColumns - Database column names
 * @param {Object} manualMapping - Optional manual column mappings
 * @returns {Object} Column mapping
 */
function createColumnMapping(csvHeaders, dbColumns, manualMapping = {}) {
  const mapping = { ...manualMapping };
  const unmappedCsv = [];
  const unmappedDb = [];

  // Normalize function for fuzzy matching
  const normalize = (str) => str.toLowerCase().replace(/[_\s-]/g, '');

  csvHeaders.forEach(csvHeader => {
    if (mapping[csvHeader]) return; // Already manually mapped

    // Try exact match first
    const exactMatch = dbColumns.find(dbCol => dbCol === csvHeader);
    if (exactMatch) {
      mapping[csvHeader] = exactMatch;
      return;
    }

    // Try normalized fuzzy match
    const normalizedCsv = normalize(csvHeader);
    const fuzzyMatch = dbColumns.find(dbCol => normalize(dbCol) === normalizedCsv);
    
    if (fuzzyMatch) {
      mapping[csvHeader] = fuzzyMatch;
    } else {
      unmappedCsv.push(csvHeader);
    }
  });

  // Find unmapped DB columns
  dbColumns.forEach(dbCol => {
    const isMapped = Object.values(mapping).includes(dbCol);
    if (!isMapped && !['id', 'created_at', 'updated_at'].includes(dbCol)) {
      unmappedDb.push(dbCol);
    }
  });

  return {
    mapping,
    unmappedCsv,
    unmappedDb,
    isComplete: unmappedDb.length === 0
  };
}

/**
 * Parse CSV with dynamic header detection
 * @param {string} filePath - Path to CSV file
 * @param {Object} options - Parse options
 * @returns {Promise<Object>} Parsed data with metadata
 */
async function parseCSVDynamic(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: options.dynamicTyping !== false,
      transformHeader: options.transformHeader || ((header) => header.trim()),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }

        resolve({
          data: results.data,
          headers: results.meta.fields || [],
          rowCount: results.data.length,
          errors: results.errors
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * Smart type conversion based on database schema
 * @param {any} value - Value to convert
 * @param {string} targetType - Target data type
 * @returns {any} Converted value
 */
function smartTypeConvert(value, targetType) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (targetType) {
    case 'number':
    case 'integer':
      const num = Number(value);
      return isNaN(num) ? null : (targetType === 'integer' ? Math.floor(num) : num);
    
    case 'string':
      return String(value).trim();
    
    case 'boolean':
      if (typeof value === 'boolean') return value;
      const str = String(value).toLowerCase();
      return str === 'true' || str === '1' || str === 'yes';
    
    case 'date':
    case 'timestamp':
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }
    
    default:
      return value;
  }
}

/**
 * Validate and transform CSV row to database format
 * @param {Object} row - CSV row
 * @param {Object} columnMapping - Column mapping
 * @param {Object} schema - Database schema
 * @param {Array} requiredFields - Required field names
 * @returns {Object} Transformed row or null if invalid
 */
function transformRow(row, columnMapping, schema = {}, requiredFields = []) {
  const transformed = {};
  const errors = [];

  // Map CSV columns to DB columns
  Object.entries(columnMapping.mapping).forEach(([csvCol, dbCol]) => {
    const value = row[csvCol];
    const schemaInfo = schema[dbCol] || { type: 'string' };
    
    transformed[dbCol] = smartTypeConvert(value, schemaInfo.type);
  });

  // Check required fields
  const missingRequired = requiredFields.filter(field => 
    !transformed[field] && transformed[field] !== 0
  );

  if (missingRequired.length > 0) {
    return {
      valid: false,
      errors: [`Missing required fields: ${missingRequired.join(', ')}`],
      data: null
    };
  }

  // Add timestamps
  if (!transformed.created_at) {
    transformed.created_at = new Date().toISOString();
  }
  if (!transformed.updated_at) {
    transformed.updated_at = new Date().toISOString();
  }

  return {
    valid: true,
    errors: [],
    data: transformed
  };
}

/**
 * Upload CSV to database with dynamic column mapping
 * @param {string} filePath - Path to CSV file
 * @param {string} tableName - Target table name
 * @param {Object} options - Upload options
 * @param {Object} options.columnMapping - Manual column mappings (csvHeader: dbColumn)
 * @param {Array} options.requiredFields - Required database fields
 * @param {boolean} options.autoDetectSchema - Auto-detect database schema (default: true)
 * @param {number} options.batchSize - Batch size for inserts (default: 100)
 * @param {boolean} options.skipValidation - Skip validation (default: false)
 * @returns {Promise<Object>} Upload result
 */
async function uploadCSVDynamic(filePath, tableName, options = {}) {
  try {
    const {
      columnMapping: manualMapping = {},
      requiredFields = [],
      autoDetectSchema = true,
      batchSize = 100,
      skipValidation = false
    } = options;

    console.log(`📊 Analyzing CSV file: ${filePath}`);
    const csvData = await parseCSVDynamic(filePath);
    
    console.log(`Found ${csvData.rowCount} rows with columns: ${csvData.headers.join(', ')}`);

    // Detect database schema
    let schema = {};
    let dbColumns = [];
    
    if (autoDetectSchema) {
      console.log(`🔍 Detecting schema for table: ${tableName}`);
      const schemaInfo = await detectTableSchema(tableName);
      
      if (!schemaInfo.isEmpty) {
        dbColumns = schemaInfo.columns.map(c => c.name);
        schema = schemaInfo.columns.reduce((acc, col) => {
          acc[col.name] = col;
          return acc;
        }, {});
        console.log(`Detected ${dbColumns.length} columns: ${dbColumns.join(', ')}`);
      } else {
        // If table is empty, use CSV headers as column names
        dbColumns = csvData.headers;
        console.warn('Table is empty. Assuming CSV headers match database columns.');
      }
    } else {
      // Use manual mapping only
      dbColumns = Object.values(manualMapping);
    }

    // Create intelligent column mapping
    const mapping = createColumnMapping(csvData.headers, dbColumns, manualMapping);
    
    console.log(`\n📋 Column Mapping:`);
    Object.entries(mapping.mapping).forEach(([csv, db]) => {
      console.log(`   "${csv}" → "${db}"`);
    });

    if (mapping.unmappedCsv.length > 0) {
      console.warn(`\n⚠️  Unmapped CSV columns (will be ignored): ${mapping.unmappedCsv.join(', ')}`);
    }

    if (mapping.unmappedDb.length > 0) {
      console.warn(`⚠️  Unmapped DB columns (will use NULL): ${mapping.unmappedDb.join(', ')}`);
    }

    // Transform and validate data
    console.log(`\n🔄 Transforming ${csvData.rowCount} rows...`);
    const validRows = [];
    const invalidRows = [];

    csvData.data.forEach((row, index) => {
      if (!skipValidation) {
        const result = transformRow(row, mapping, schema, requiredFields);
        if (result.valid) {
          validRows.push(result.data);
        } else {
          invalidRows.push({
            rowNumber: index + 2,
            errors: result.errors,
            data: row
          });
        }
      } else {
        // Simple mapping without validation
        const transformed = {};
        Object.entries(mapping.mapping).forEach(([csvCol, dbCol]) => {
          transformed[dbCol] = row[csvCol];
        });
        transformed.created_at = new Date().toISOString();
        transformed.updated_at = new Date().toISOString();
        validRows.push(transformed);
      }
    });

    console.log(`✓ Valid rows: ${validRows.length}`);
    if (invalidRows.length > 0) {
      console.warn(`✗ Invalid rows: ${invalidRows.length}`);
      invalidRows.slice(0, 5).forEach(err => {
        console.warn(`   Row ${err.rowNumber}: ${err.errors.join(', ')}`);
      });
    }

    if (validRows.length === 0) {
      throw new Error('No valid rows to upload');
    }

    // Upload in batches
    console.log(`\n📤 Uploading ${validRows.length} rows to '${tableName}'...`);
    const results = [];
    let totalInserted = 0;

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from(tableName)
        .insert(batch)
        .select();

      if (error) {
        throw new Error(`Insert error: ${error.message}`);
      }

      totalInserted += data.length;
      results.push(...data);
      console.log(`   Batch ${Math.floor(i / batchSize) + 1}: ${data.length} rows inserted`);
    }

    console.log(`\n✅ Upload complete: ${totalInserted} records inserted`);

    return {
      success: true,
      uploaded: totalInserted,
      invalid: invalidRows.length,
      invalidRows: invalidRows,
      columnMapping: mapping.mapping,
      unmappedColumns: {
        csv: mapping.unmappedCsv,
        database: mapping.unmappedDb
      },
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
 * Preview CSV with intelligent mapping suggestions
 * @param {string} filePath - Path to CSV file
 * @param {string} tableName - Target table name
 * @param {Object} manualMapping - Manual column mappings
 * @returns {Promise<Object>} Preview with mapping suggestions
 */
async function previewCSVMapping(filePath, tableName, manualMapping = {}) {
  try {
    console.log(`📊 Analyzing CSV: ${filePath}`);
    const csvData = await parseCSVDynamic(filePath);

    console.log(`🔍 Detecting schema for table: ${tableName}`);
    const schemaInfo = await detectTableSchema(tableName);
    const dbColumns = schemaInfo.isEmpty ? [] : schemaInfo.columns.map(c => c.name);

    const mapping = createColumnMapping(csvData.headers, dbColumns, manualMapping);

    return {
      success: true,
      csvHeaders: csvData.headers,
      databaseColumns: dbColumns,
      suggestedMapping: mapping.mapping,
      unmappedCsvColumns: mapping.unmappedCsv,
      unmappedDbColumns: mapping.unmappedDb,
      sampleRows: csvData.data.slice(0, 5),
      totalRows: csvData.rowCount,
      message: `CSV has ${csvData.headers.length} columns, DB has ${dbColumns.length} columns`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upsert with dynamic mapping
 * @param {string} filePath - Path to CSV file
 * @param {string} tableName - Target table name
 * @param {Object} options - Upload options (same as uploadCSVDynamic)
 * @param {Array} options.conflictColumns - Columns for conflict resolution
 * @returns {Promise<Object>} Upsert result
 */
async function upsertCSVDynamic(filePath, tableName, options = {}) {
  try {
    const {
      columnMapping: manualMapping = {},
      requiredFields = [],
      autoDetectSchema = true,
      batchSize = 100,
      conflictColumns = []
    } = options;

    console.log(`📊 Analyzing CSV file: ${filePath}`);
    const csvData = await parseCSVDynamic(filePath);

    // Detect schema and create mapping (same as uploadCSVDynamic)
    let schema = {};
    let dbColumns = [];
    
    if (autoDetectSchema) {
      const schemaInfo = await detectTableSchema(tableName);
      if (!schemaInfo.isEmpty) {
        dbColumns = schemaInfo.columns.map(c => c.name);
        schema = schemaInfo.columns.reduce((acc, col) => {
          acc[col.name] = col;
          return acc;
        }, {});
      } else {
        dbColumns = csvData.headers;
      }
    } else {
      dbColumns = Object.values(manualMapping);
    }

    const mapping = createColumnMapping(csvData.headers, dbColumns, manualMapping);

    // Transform data
    const validRows = [];
    csvData.data.forEach((row) => {
      const result = transformRow(row, mapping, schema, requiredFields);
      if (result.valid) {
        validRows.push(result.data);
      }
    });

    if (validRows.length === 0) {
      throw new Error('No valid rows to upsert');
    }

    console.log(`🔄 Upserting ${validRows.length} rows...`);
    const results = [];
    let totalUpserted = 0;

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      
      const upsertOptions = conflictColumns.length > 0 
        ? { onConflict: conflictColumns.join(','), ignoreDuplicates: false }
        : {};

      const { data, error } = await supabase
        .from(tableName)
        .upsert(batch, upsertOptions)
        .select();

      if (error) {
        throw new Error(`Upsert error: ${error.message}`);
      }

      totalUpserted += data.length;
      results.push(...data);
    }

    console.log(`✅ Upsert complete: ${totalUpserted} records processed`);

    return {
      success: true,
      upserted: totalUpserted,
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

module.exports = {
  detectTableSchema,
  createColumnMapping,
  parseCSVDynamic,
  smartTypeConvert,
  uploadCSVDynamic,
  previewCSVMapping,
  upsertCSVDynamic
};
