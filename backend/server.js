const path = require('path');
// load backend-specific .env first so process.env values are available to modules
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const connectDB = require('./db');
const cors = require('cors');

const app = express();
// connect to database
connectDB();
app.get('/api', (req, res) => {
	res.send('welcome to cyberoscope');
});
// middleware
// allow only the dev frontends on localhost:5173 and localhost:5174
app.use(cors({
	origin: ['http://localhost:5173', 'http://localhost:5174']
}));
app.use(express.json());

// routes
const scoreRoutes = require('./controller/scoreController');
app.use('/api/score', scoreRoutes);
const registrationRoutes = require('./controller/registrationController');
app.use('/api/registrations', registrationRoutes);

// demo route


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
