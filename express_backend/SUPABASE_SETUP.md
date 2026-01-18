# Supabase Integration for Express Backend

## Overview
This express backend has been migrated from MongoDB to Supabase (PostgreSQL with PostgREST API).

## Step-by-Step Setup

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New project"
3. Fill in project details:
   - **Name:** medshare
   - **Password:** Choose a strong password
   - **Region:** Select closest to your location
4. Wait 2-3 minutes for initialization

### Step 2: Create Database Tables

Open Supabase SQL Editor and run:

```sql
-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_quantity CHECK (quantity >= 0)
);

-- Create indexes
CREATE INDEX idx_inventory_name ON inventory(name);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_category ON inventory(category);
```

### Step 3: Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** → SUPABASE_URL
   - **anon public** key → SUPABASE_ANON_KEY

### Step 4: Configure Environment Variables

Update your `.env` file:

```env
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here

# API Keys (existing)
NEWS_API_KEY=your-news-api-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_SECRET=your-gemini-secret
```

Replace:
- `your-project-id` - Your Supabase project ID
- `your-anon-public-key-here` - Your anon public key

### Step 5: Install Dependencies

```bash
npm install
```

This installs:
- `@supabase/supabase-js` - Supabase client library
- All other existing dependencies

### Step 6: Start the Server

```bash
node express.js
```

You should see:
```
🚀 Starting MedShare Express Backend...
✅ Connected to Supabase successfully
✅ Server running on http://localhost:5000
🔌 Database: Supabase
```

### Step 7: Test the Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Get all inventory
curl http://localhost:5000/api/inventory

# Create inventory item
curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"name": "Item 1", "quantity": 10, "price": 99.99}'

# Get by ID
curl http://localhost:5000/api/inventory/{id}

# Update item
curl -X PUT http://localhost:5000/api/inventory/{id} \
  -H "Content-Type: application/json" \
  -d '{"quantity": 20}'

# Delete item
curl -X DELETE http://localhost:5000/api/inventory/{id}

# Search items
curl "http://localhost:5000/api/inventory?search=item"

# Get statistics
curl http://localhost:5000/api/inventory/stats/summary
```

## Project Structure

```
express_backend/
├── config/
│   └── supabase.js                 # Supabase client & connection
├── routes/
│   ├── inventory.js                # Inventory CRUD endpoints
│   └── news.js                     # News endpoints (unchanged)
├── services/
│   └── inventoryService.js         # Inventory business logic
├── express.js                      # Main server file
├── package.json                    # Dependencies
├── .env                            # Environment variables
└── .env.example                    # Example env file
```

## API Endpoints

### Inventory Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get all items (supports ?search=) |
| GET | `/api/inventory/:id` | Get single item by ID |
| POST | `/api/inventory` | Create new item |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Delete item |
| GET | `/api/inventory/stats/summary` | Get statistics |

### Health Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check database connection status |

## What Changed from MongoDB

### Before (MongoDB)
- Used `mongoose` ORM
- MongoDB Atlas connection
- Schemaless documents
- Imported `mongoose` and `mongodb` packages

### After (Supabase)
- Uses `@supabase/supabase-js` client
- PostgreSQL database via PostgREST API
- Structured SQL tables
- Service classes instead of Models

### Code Structure Comparison

```javascript
// OLD (MongoDB with Mongoose)
const mongoose = require('mongoose');
const uri = process.env.MONGO_URI;
await mongoose.connect(uri);

// NEW (Supabase)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('inventory').select('*');
```

## Services

### InventoryService (`services/inventoryService.js`)

Available methods:
- `findAll()` - Get all inventory items
- `findById(id)` - Get single item
- `search(searchTerm)` - Search items
- `create(data)` - Create new item
- `update(id, data)` - Update item
- `delete(id)` - Delete item
- `getStatistics()` - Get stats

All methods are async and return promises.

## Error Handling

All endpoints return standardized responses:

```json
{
  "success": true,
  "data": { ... }
}
```

On error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Troubleshooting

### "Missing Supabase credentials"
- Check `.env` has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Verify Supabase project is created
- Restart server after updating .env

### "Connection failed"
- Check internet connection
- Verify Supabase project is active
- Check credentials are correct

### "Table not found"
- Run SQL to create `inventory` table
- Verify table name matches (lowercase)

### Port already in use
```bash
# Change PORT in .env
# Or kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

## Development Tips

### Enable Request Logging

Add to `express.js`:
```javascript
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
```

### Test with Postman/Insomnia

Import collection:
```json
{
  "info": { "name": "MedShare Express API" },
  "item": [
    {
      "name": "Health Check",
      "request": { "method": "GET", "url": "http://localhost:5000/health" }
    },
    {
      "name": "Get All Inventory",
      "request": { "method": "GET", "url": "http://localhost:5000/api/inventory" }
    }
  ]
}
```

## Production Deployment

### Environment Setup

Create `.env.production`:
```env
NODE_ENV=production
PORT=5000

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

NEWS_API_KEY=your-key
GEMINI_API_KEY=your-key
GEMINI_API_SECRET=your-secret
```

### Deploy Steps

1. Build (if applicable):
   ```bash
   npm run build
   ```

2. Start server:
   ```bash
   NODE_ENV=production node express.js
   ```

3. Use process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start express.js --name medshare-backend
   ```

## Security Considerations

1. **Never commit .env** - Add to `.gitignore`
2. **Use environment variables** - For all sensitive data
3. **Enable RLS** - Row Level Security in Supabase (optional)
4. **Validate inputs** - Add validation middleware
5. **Use HTTPS** - In production
6. **Rate limiting** - Prevent abuse

## Next Steps

1. ✅ Create Supabase project
2. ✅ Create database tables
3. ✅ Configure environment variables
4. ✅ Install dependencies
5. ✅ Start server
6. ✅ Test endpoints
7. Deploy to production

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Express.js Docs:** https://expressjs.com
- **PostgREST API:** https://postgrest.org
- **Issues:** Check GitHub repository
