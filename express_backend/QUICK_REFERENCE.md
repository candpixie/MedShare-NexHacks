# Quick Reference: Supabase Express Backend

## 📋 Setup in 5 Minutes

```bash
# 1. Create Supabase project at https://supabase.com
# 2. Copy Project URL and Anon Key from Settings → API
# 3. Run this SQL in Supabase SQL Editor:
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  description TEXT,
  quantity INTEGER,
  price DECIMAL(10,2),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 4. Update .env with credentials:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# 5. Install and run:
npm install
node express.js
```

## 🧪 Testing Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Get all items
curl http://localhost:5000/api/inventory

# Create item
curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"name":"Item 1","quantity":10,"price":99.99}'

# Get item by ID (replace {id} with real UUID)
curl http://localhost:5000/api/inventory/{id}

# Search items
curl "http://localhost:5000/api/inventory?search=item"

# Update item
curl -X PUT http://localhost:5000/api/inventory/{id} \
  -H "Content-Type: application/json" \
  -d '{"quantity":20}'

# Delete item
curl -X DELETE http://localhost:5000/api/inventory/{id}

# Get statistics
curl http://localhost:5000/api/inventory/stats/summary
```

## 📁 Project Structure

```
express_backend/
├── config/
│   └── supabase.js                 # Supabase client
├── routes/
│   ├── inventory.js                # Inventory endpoints
│   └── news.js                     # News endpoints
├── services/
│   └── inventoryService.js         # Business logic
├── express.js                      # Server entry point
├── package.json                    # Dependencies
├── .env                            # Your credentials (gitignored)
├── SUPABASE_SETUP.md              # Detailed setup guide
└── IMPLEMENTATION_SUMMARY.md       # What changed
```

## 🔑 Environment Variables

```env
# REQUIRED - Get from Supabase dashboard
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Optional
PORT=5000                          # Default 5000
NODE_ENV=development               # development or production

# Existing (for news/AI features)
NEWS_API_KEY=your-news-key
GEMINI_API_KEY=your-gemini-key
GEMINI_API_SECRET=your-secret
```

## 🔗 API Response Format

All endpoints return JSON:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "count": 5
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 📊 Database Table Schema

```sql
Table: inventory

Columns:
- id: UUID (primary key)
- name: VARCHAR(255)
- description: TEXT
- quantity: INTEGER
- price: DECIMAL(10,2)
- category: VARCHAR(100)
- status: VARCHAR(50) ['active', 'inactive']
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Indexes:
- name (for searching)
- status (for filtering)
- category (for categorizing)
```

## 🎯 InventoryService Methods

```javascript
const inventoryService = require('./services/inventoryService');

// Get all items
const items = await inventoryService.findAll();

// Get by ID
const item = await inventoryService.findById('uuid');

// Search
const results = await inventoryService.search('search term');

// Create
const newItem = await inventoryService.create({
  name: 'Item',
  quantity: 10,
  price: 99.99
});

// Update
const updated = await inventoryService.update('uuid', {
  quantity: 20
});

// Delete
const success = await inventoryService.delete('uuid');

// Statistics
const stats = await inventoryService.getStatistics();
```

## 🚀 Running the Server

```bash
# Development (will restart on changes with nodemon)
node express.js

# Production (with PM2)
npm install -g pm2
pm2 start express.js --name "medshare-backend"

# View logs
pm2 logs medshare-backend

# Stop
pm2 stop medshare-backend
```

## 🔍 Monitoring

**Health Endpoint:**
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-17T10:30:00Z"
}
```

**Supabase Dashboard:**
- URL: https://supabase.com/dashboard
- View real-time data
- Monitor queries
- Check storage usage

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Missing credentials" | Update .env with SUPABASE_URL and SUPABASE_ANON_KEY |
| "Table not found" | Run CREATE TABLE SQL in Supabase SQL Editor |
| "Connection failed" | Check internet, verify project is active |
| "Port in use" | Change PORT in .env or `lsof -ti:5000 \| xargs kill` |
| "Module not found" | Run `npm install` |

## 📚 Resources

- **Supabase Docs:** https://supabase.com/docs
- **Express.js Guide:** https://expressjs.com
- **SQL Tutorial:** https://www.postgresql.org/docs
- **REST API Docs:** https://postgrest.org

## 🔐 Security Notes

1. ✅ Never commit .env file (already in .gitignore)
2. ✅ Use environment variables for all secrets
3. ✅ Enable RLS policies in production
4. ✅ Validate all user inputs
5. ✅ Use HTTPS in production
6. ✅ Implement rate limiting

## 📞 Support

- Check `SUPABASE_SETUP.md` for detailed guide
- Review `IMPLEMENTATION_SUMMARY.md` for what changed
- Check server console for error messages
- Visit https://supabase.com/docs for official help

---

**Last Updated:** January 17, 2026
**Status:** ✅ Ready for deployment
