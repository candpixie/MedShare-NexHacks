const { upsertInventoryFromCSV } = require('./csvtodb');


async function run() {
  // BEST choice: upsert (insert + update)
  const result = await upsertInventoryFromCSV();

  // Or, if you ONLY want inserts:
  // const result = await uploadCSVToSupabase();

  console.log('RESULT:', result);
}

run().catch(console.error);
