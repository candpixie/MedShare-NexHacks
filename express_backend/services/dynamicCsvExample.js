const {
  uploadCSVDynamic,
  previewCSVMapping,
  upsertCSVDynamic
} = require('./dynamicCsvToDB');

/**
 * Example 1: Upload with auto-detection (no manual mapping needed)
 */
async function example1_AutoDetection() {
  console.log('\n=== Example 1: Auto-Detection ===\n');
  
  const result = await uploadCSVDynamic(
    './data/medications.csv',
    'inventory',
    {
      autoDetectSchema: true,
      batchSize: 100
    }
  );
  
  console.log('\nResult:', result);
}

/**
 * Example 2: Preview mapping before upload
 */
async function example2_PreviewMapping() {
  console.log('\n=== Example 2: Preview Mapping ===\n');
  
  const preview = await previewCSVMapping(
    './data/medications.csv',
    'inventory'
  );
  
  console.log('\n📋 Mapping Preview:');
  console.log('CSV Headers:', preview.csvHeaders);
  console.log('DB Columns:', preview.databaseColumns);
  console.log('Suggested Mapping:', preview.suggestedMapping);
  console.log('Unmapped CSV columns:', preview.unmappedCsvColumns);
  console.log('Unmapped DB columns:', preview.unmappedDbColumns);
  console.log('\n📊 Sample Data:');
  console.table(preview.sampleRows);
}

/**
 * Example 3: Upload with manual column mapping
 * Use when CSV headers don't match DB columns
 */
async function example3_ManualMapping() {
  console.log('\n=== Example 3: Manual Mapping ===\n');
  
  const result = await uploadCSVDynamic(
    './data/products.csv',
    'inventory',
    {
      columnMapping: {
        'Product Code': 'ndc_code',
        'Product Name': 'drug_name',
        'Type': 'form_type',
        'Stock': 'quantity',
        'Batch': 'lot_number',
        'Expiry': 'expiration_date',
        'Price': 'unit_cost'
      },
      requiredFields: ['ndc_code', 'drug_name', 'quantity'],
      autoDetectSchema: true
    }
  );
  
  console.log('\nResult:', result);
}

/**
 * Example 4: Upsert with conflict resolution
 */
async function example4_Upsert() {
  console.log('\n=== Example 4: Upsert (Insert or Update) ===\n');
  
  const result = await upsertCSVDynamic(
    './data/medications.csv',
    'inventory',
    {
      autoDetectSchema: true,
      conflictColumns: ['ndc_code', 'lot_number'], // Update if these match
      batchSize: 100
    }
  );
  
  console.log('\nResult:', result);
}

/**
 * Example 5: Flexible CSV with mixed headers
 */
async function example5_FlexibleHeaders() {
  console.log('\n=== Example 5: Flexible Headers ===\n');
  
  // This will work with headers like:
  // "NDC Code", "ndc_code", "NDC-CODE", etc.
  // Smart fuzzy matching will handle variations
  
  const result = await uploadCSVDynamic(
    './data/flexible.csv',
    'inventory',
    {
      autoDetectSchema: true,
      skipValidation: false // Set to true to skip validation
    }
  );
  
  console.log('\nResult:', result);
}

// Uncomment to run examples:
// example1_AutoDetection();
// example2_PreviewMapping();
// example3_ManualMapping();
// example4_Upsert();
// example5_FlexibleHeaders();

module.exports = {
  example1_AutoDetection,
  example2_PreviewMapping,
  example3_ManualMapping,
  example4_Upsert,
  example5_FlexibleHeaders
};
