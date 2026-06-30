const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/payments
router.get('/', async (req, res) => {
    try {
        const payments = await db.jsonDb.getPayments();
        return res.json(payments);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/payments/audits
router.get('/audits', async (req, res) => {
    try {
        const audits = await db.jsonDb.getAudits();
        return res.json(audits);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/payments
router.post('/', async (req, res) => {
    const { rental_id, amount, method } = req.body;
    if (!rental_id || !amount || !method) {
        return res.status(400).json({ error: 'Rental ID, amount, and payment method are required.' });
    }

    try {
        const newPayment = {
            rental_id: Number(rental_id),
            amount: Number(amount),
            method
        };

        const result = await db.jsonDb.createPayment(newPayment);
        return res.json({ success: true, payment: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.jsonDb.deletePayment(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
