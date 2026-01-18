const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db = null;

async function connectDB() {
    try {
        await client.connect();
        db = client.db();
        console.log(' Connected to MongoDB successfully');
        return db;
    } catch (error) {
        console.error(' MongoDB connection error:', error);
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
}

async function closeDB() {
    await client.close();
    console.log('MongoDB connection closed');
}

module.exports = { connectDB, getDB, closeDB };
