const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/maintenance
router.get('/', async (req, res) => {
    try {
        const maintenance = await db.jsonDb.getMaintenance();
        return res.json(maintenance);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/maintenance
router.post('/', async (req, res) => {
    const { car_id, issue_description, cost, status } = req.body;
    if (!car_id || !issue_description) {
        return res.status(400).json({ error: 'Car ID and issue description are required.' });
    }

    try {
        const newMaint = {
            car_id: Number(car_id),
            issue_description,
            cost: cost ? Number(cost) : 0,
            status: status || 'PENDING'
        };

        const result = await db.jsonDb.createMaintenance(newMaint);
        return res.json({ success: true, maintenance: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PUT /api/maintenance/:id
router.put('/:id', async (req, res) => {
    const { car_id, issue_description, cost, status } = req.body;
    try {
        const prev = db.isOracle() 
            ? await db.execute(`SELECT * FROM maintenance WHERE maintenance_id = :id`, { id: Number(req.params.id) }).then(rows => rows[0])
            : await db.jsonDb.getMaintenance().then(list => list.find(m => m.maintenance_id === Number(req.params.id)));
        
        if (!prev) return res.status(404).json({ error: 'Maintenance log not found' });

        const updated = {
            car_id: car_id ? Number(car_id) : prev.car_id,
            issue_description: issue_description || prev.issue_description,
            cost: cost ? Number(cost) : prev.cost,
            status: status || prev.status
        };

        const result = await db.jsonDb.updateMaintenance(req.params.id, updated);
        return res.json({ success: true, maintenance: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/maintenance/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.jsonDb.deleteMaintenance(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
