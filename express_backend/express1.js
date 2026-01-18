const express = require('express');
const app = express();
const cors = require("cors");
app.use(cors());


app.use(express.json());


const newsRoutes = require('./routes/news');
app.use('/news', newsRoutes);



app.listen(3000, () => {
    console.log('Server running on port 3000');
});

app.get('/', (req, res) => {
    res.send('<h1>Hello, Express.js Server!</h1>');
});

