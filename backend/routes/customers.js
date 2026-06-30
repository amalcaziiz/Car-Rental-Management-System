const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/customers
router.get('/', async (req, res) => {
    try {
        const customers = await db.jsonDb.getCustomers();
        return res.json(customers);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
    try {
        const customer = await db.jsonDb.getCustomerById(req.params.id);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        return res.json(customer);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/customers
router.post('/', async (req, res) => {
    const { full_name, phone, email, national_id } = req.body;
    if (!full_name || !phone || !email || !national_id) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const customers = await db.jsonDb.getCustomers();
        
        if (customers.find(c => c.phone === phone)) return res.status(400).json({ error: 'Unique constraint violation: Phone already registered!' });
        if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) return res.status(400).json({ error: 'Unique constraint violation: Email already registered!' });
        if (customers.find(c => c.national_id.toUpperCase() === national_id.toUpperCase())) return res.status(400).json({ error: 'Unique constraint violation: National ID already registered!' });

        const newCustomer = {
            full_name,
            phone,
            email,
            national_id
        };

        const result = await db.jsonDb.createCustomer(newCustomer);
        return res.json({ success: true, customer: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
    const { full_name, phone, email, national_id } = req.body;

    try {
        const customer = await db.jsonDb.getCustomerById(req.params.id);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const customers = await db.jsonDb.getCustomers();
        if (phone && customers.find(c => c.phone === phone && c.customer_id !== Number(req.params.id))) {
            return res.status(400).json({ error: 'Phone already in use.' });
        }
        if (email && customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.customer_id !== Number(req.params.id))) {
            return res.status(400).json({ error: 'Email already in use.' });
        }
        if (national_id && customers.find(c => c.national_id.toUpperCase() === national_id.toUpperCase() && c.customer_id !== Number(req.params.id))) {
            return res.status(400).json({ error: 'National ID already in use.' });
        }

        const updated = {
            full_name: full_name || customer.full_name,
            phone: phone || customer.phone,
            email: email || customer.email,
            national_id: national_id || customer.national_id
        };

        const result = await db.jsonDb.updateCustomer(req.params.id, updated);
        return res.json({ success: true, customer: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.jsonDb.deleteCustomer(req.params.id);
        return res.json({ success: true, message: 'Customer record deleted.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
