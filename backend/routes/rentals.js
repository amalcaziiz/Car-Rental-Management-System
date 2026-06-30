const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/rentals
router.get('/', async (req, res) => {
    try {
        const rentals = await db.jsonDb.getRentals();
        return res.json(rentals);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/rentals
router.post('/', async (req, res) => {
    const { customer_id, car_id, user_id, start_date, end_date } = req.body;
    if (!customer_id || !car_id || !user_id || !start_date || !end_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (end <= start) {
            return res.status(400).json({ error: 'chk_dates constraint violation: end_date must be greater than start_date' });
        }

        const newRental = {
            customer_id,
            car_id,
            user_id,
            start_date,
            end_date
        };

        const result = await db.jsonDb.createRental(newRental);
        return res.json({ success: true, rental: result });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// POST /api/rentals/:id/return
router.post('/:id/return', async (req, res) => {
    try {
        await db.jsonDb.returnRental(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PUT /api/rentals/:id
router.put('/:id', async (req, res) => {
    const { customer_id, car_id, start_date, end_date, status } = req.body;
    if (!customer_id || !car_id || !start_date || !end_date || !status) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (end <= start) {
            return res.status(400).json({ error: 'chk_dates constraint violation: end_date must be greater than start_date' });
        }

        await db.jsonDb.updateRental(req.params.id, { customer_id, car_id, start_date, end_date, status });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/rentals/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.jsonDb.deleteRental(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
