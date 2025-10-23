const path = require('path');
// load backend-specific .env first so process.env values are available to modules
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const connectDB = require('./db');

const app = express();
// connect to database
connectDB();

// middleware
app.use(express.json());

// routes
const scoreRoutes = require('./controller/scoreController');
app.use('/api/score', scoreRoutes);

// demo route
app.get('/', (req, res) => {
	res.send('welcome to cyberoscope');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
