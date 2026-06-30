const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const users = await db.jsonDb.getUsers();
        // Hide passwords
        const sanitized = users.map(u => ({
            user_id: u.user_id,
            username: u.username,
            role: u.role,
            created_at: u.created_at
        }));
        return res.json(sanitized);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const users = await db.jsonDb.getUsers();
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return res.status(400).json({ error: 'Username already taken.' });
        }

        const newUser = {
            username,
            password,
            role
        };

        const result = await db.jsonDb.createUser(newUser);
        return res.json({ success: true, user: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
    const { password, role } = req.body;
    try {
        const user = db.isOracle()
            ? await db.execute(`SELECT * FROM users WHERE user_id = :id`, { id: Number(req.params.id) }).then(rows => rows[0])
            : await db.jsonDb.getUsers().then(list => list.find(u => u.user_id === Number(req.params.id)));
        
        if (!user) return res.status(404).json({ error: 'User not found' });

        const updated = {
            password: password || user.password,
            role: role || user.role
        };

        const result = await db.jsonDb.updateUser(req.params.id, updated);
        return res.json({ success: true, user: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    if (Number(req.params.id) === 1) {
        return res.status(400).json({ error: 'Primary administrator account cannot be deleted.' });
    }

    try {
        await db.jsonDb.deleteUser(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
