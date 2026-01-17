const express = require('express');
const app = express();
const cors = require("cors");
const { connectDB } = require('./config/database');
require('dotenv').config();

app.use(cors());
app.use(express.json());

// Routes
const newsRoutes = require('./routes/news');
const inventoryRoutes = require('./routes/inventory');

app.use('/news', newsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

app.get('/', (req, res) => {
    res.send('<h1>Hello, Express.js Server!</h1>');
});



