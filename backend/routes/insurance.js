const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/insurance
router.get('/', async (req, res) => {
    try {
        const insurance = await db.jsonDb.getInsurance();
        return res.json(insurance);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/insurance
router.post('/', async (req, res) => {
    const { car_id, provider, cost, expiry_date } = req.body;
    if (!car_id || !provider || !cost || !expiry_date) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const newPolicy = {
            car_id: Number(car_id),
            provider,
            cost: Number(cost),
            expiry_date
        };

        const result = await db.jsonDb.createInsurance(newPolicy);
        return res.json({ success: true, insurance: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PUT /api/insurance/:id
router.put('/:id', async (req, res) => {
    const { car_id, provider, cost, expiry_date } = req.body;
    try {
        const prev = db.isOracle() 
            ? await db.execute(`SELECT * FROM insurance WHERE insurance_id = :id`, { id: Number(req.params.id) }).then(rows => rows[0])
            : await db.jsonDb.getInsurance().then(list => list.find(i => i.insurance_id === Number(req.params.id)));
        
        if (!prev) return res.status(404).json({ error: 'Policy not found' });

        const updated = {
            car_id: car_id ? Number(car_id) : prev.car_id,
            provider: provider || prev.provider,
            cost: cost ? Number(cost) : prev.cost,
            expiry_date: expiry_date || prev.expiry_date
        };

        const result = await db.jsonDb.updateInsurance(req.params.id, updated);
        return res.json({ success: true, insurance: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/insurance/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.jsonDb.deleteInsurance(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
