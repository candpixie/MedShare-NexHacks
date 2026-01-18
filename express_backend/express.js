const express = require('express');
const app = express();
const cors = require("cors");
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors());
app.use(express.json());

// Routes
const newsRoutes = require('./routes/news');
const inventoryRoutes = require('./routes/inventory');

app.use('/news', newsRoutes);
app.use('/api/inventory', inventoryRoutes);

// MongoDB Connection with Mongoose
const uri = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

async function connectDB() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB successfully');
        return mongoose.connection;
    } catch (error) {
        console.error(' MongoDB connection error:', error);
        throw error;
    }
}

function getDB() {
    if (!mongoose.connection.readyState) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return mongoose.connection.db;
}

async function closeDB() {
    await mongoose.connection.close();
    console.log( 'MongoDB connection closed');
}

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Connect to MongoDB and start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

app.get('/', (req, res) => {
    res.send('<h1>Hello, Express.js Server!</h1>');
});

// Export connection functions for use in other modules
module.exports = { connectDB, getDB, closeDB, app };



