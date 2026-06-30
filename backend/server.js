/**
 * Express Server for Car Rental Management System
 * Connects to Oracle / Local Fallback Database
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serving the frontend directory statically
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    }
}));

// Register API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/rentals', require('./routes/rentals'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/insurance', require('./routes/insurance'));
app.use('/api/users', require('./routes/users'));
app.use('/api/console', require('./routes/console'));

// Root fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Seed Resetter API Endpoint
app.post('/api/reset-seeds', (req, res) => {
    try {
        db.jsonDb.resetSeeds();
        res.json({ success: true, message: 'Database reset to seeds successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bootstrapping Server & Database
(async () => {
    await db.initialize();
    app.listen(PORT, () => {
        console.log(`=============================================================`);
        console.log(`  Car Rental Management Backend is running on port ${PORT}`);
        console.log(`  Access Frontend directly at: http://localhost:${PORT}`);
        console.log(`=============================================================`);
    });
})();
