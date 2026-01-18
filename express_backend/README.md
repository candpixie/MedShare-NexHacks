# MedShare Backend Setup Guide

This is the Express.js backend for the MedShare application, a medical inventory and news management system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Overview](#project-overview)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (for version control)
- A **Supabase** account - [Sign up here](https://supabase.com)

### Verify Installation

```bash
node --version
npm --version
```

## Project Overview

MedShare Backend is built with:

- **Express.js** - Node.js web application framework
- **Supabase** - PostgreSQL database with REST API
- **CORS** - Cross-Origin Resource Sharing support
- **dotenv** - Environment variable management
- **NewsAPI** - Medical news integration
- **Google GenAI** - AI-powered features

## Installation

### 1. Clone the Repository

```bash
cd /path/to/MedShare-NexHacks
```

### 2. Navigate to Backend Directory

```bash
cd express_backend
```

### 3. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:

- `express` - Web framework
- `cors` - Handle cross-origin requests
- `dotenv` - Load environment variables
- `@supabase/supabase-js` - Supabase client
- `newsapi` - News API client
- `@google/genai` - Google AI client
- `cheerio` - Web scraping

## Environment Configuration

### 1. Create `.env` File

Create a `.env` file in the `express_backend` directory:

```bash
touch .env
```

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# External APIs
NEWS_API_KEY=your_newsapi_key_here
GOOGLE_GENAI_API_KEY=your_google_genai_key_here
```

### How to Get Credentials

#### Supabase Credentials:

1. Go to [Supabase Dashboard](https://supabase.com)
2. Create a new project or select existing one
3. Navigate to **Settings → API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

#### NewsAPI Key:

1. Go to [NewsAPI](https://newsapi.org)
2. Sign up for a free account
3. Copy your API key

#### Google GenAI Key:

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Copy and paste it to `.env`

## Database Setup

For detailed database setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

### Quick Setup:

1. **Create Supabase Project** - See SUPABASE_SETUP.md
2. **Run SQL Schema** - Execute the SQL provided in SUPABASE_SETUP.md
3. **Configure Environment Variables** - Add Supabase credentials to `.env`
4. **Test Connection** - Run the health check endpoint

## Running the Server

### Development Mode

```bash
npm start
```

or

```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.

### Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:3000
# Should return: "ok"

curl http://localhost:3000/health
# Should return JSON with status and database connection info
```

## API Endpoints

### Health Check

- **GET** `/health`
  - Returns server status and database connection status
  - Response:
    ```json
    {
      "status": "ok",
      "database": "connected",
      "timestamp": "2024-01-17T10:30:00.000Z"
    }
    ```

### News Endpoints

- **GET** `/news` - Fetch medical news

### Inventory Endpoints

- **GET** `/api/inventory` - Get all inventory items
- **GET** `/api/inventory/:id` - Get specific inventory item
- **POST** `/api/inventory` - Create new inventory item
- **PUT** `/api/inventory/:id` - Update inventory item
- **DELETE** `/api/inventory/:id` - Delete inventory item

For detailed API documentation, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) and [QUICK_REFERENCE.md](./QUICK_REFERENCE.md).

## Project Structure

```
express_backend/
├── server.js                    # Main application file
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables (create this)
├── SUPABASE_SETUP.md           # Database setup guide
├── IMPLEMENTATION_SUMMARY.md    # Feature documentation
├── QUICK_REFERENCE.md          # Quick API reference
├── config/
│   └── supabase.js             # Supabase configuration
├── routes/
│   ├── inventory.js            # Inventory API routes
│   └── news.js                 # News API routes
└── services/
    └── inventoryService.js     # Business logic for inventory
```

## Troubleshooting

### Issue: "Cannot find module" Error

**Solution:** Make sure all dependencies are installed:

```bash
npm install
```

### Issue: Port 3000 Already in Use

**Solution:** Change the PORT in `.env` file:

```env
PORT=3001
```

Then start the server:

```bash
npm start
```

### Issue: Supabase Connection Failed

**Checklist:**

- [ ] `.env` file exists in `express_backend` directory
- [ ] `SUPABASE_URL` is correct (should start with `https://`)
- [ ] `SUPABASE_ANON_KEY` is correctly copied
- [ ] Internet connection is active
- [ ] Supabase project is active

Test connection:

```bash
curl http://localhost:3000/health
```

### Issue: CORS Errors in Frontend

The backend is configured to accept CORS requests. Ensure:

- Frontend is making requests to correct URL
- `http://localhost:3000` is the default backend URL
- Check `.env` configuration

### Issue: News API Not Working

- Verify `NEWS_API_KEY` is in `.env`
- Check API key validity at [NewsAPI Dashboard](https://newsapi.org/dashboard)
- Ensure API key has sufficient requests remaining

## Development Tips

### Useful npm Commands

```bash
# Start the server
npm start

# Run tests (currently not configured)
npm test
```

### Enable Debug Logging

Add to `.env`:

```env
DEBUG=medshare:*
```

### Monitor Changes

For auto-restart on file changes, install nodemon:

```bash
npm install --save-dev nodemon
```

Update `package.json` scripts:

```json
"dev": "nodemon server.js"
```

## Next Steps

1. Complete environment configuration
2. Set up Supabase database
3. Start the development server
4. Test health endpoint
5. Integrate with frontend

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Documentation](https://nodejs.org/docs/)

## Support

For issues or questions:

1. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database setup
2. Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for features
3. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for API details

---

**Last Updated:** January 2024
