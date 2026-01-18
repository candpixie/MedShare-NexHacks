require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { testConnection } = require('./config/supabase');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const newsRoutes = require('./routes/news');
const inventoryRoutes = require('./routes/inventory');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');

app.use('/news', newsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);

// Root endpoint
app.get("/", (req, res) => res.send("ok"));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({ 
            status: 'ok',
            database: dbConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
    try {
        console.log('Starting MedShare Express Backend...');
        
        // Test Supabase connection
        await testConnection();

        app.listen(PORT, () => {
            console.log(`Listening on ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = { app };



