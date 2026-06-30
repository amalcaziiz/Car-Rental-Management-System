const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const users = await db.jsonDb.getUsers();
        // Since getUsers sanitizes, we should query Oracle directly to authenticate
        // or check password match. To support both, get standard list
        const rawUsers = db.isOracle() 
            ? await db.execute(`SELECT * FROM users WHERE LOWER(username) = :u`, [username.toLowerCase().trim()])
            : db.jsonDb.getUsers(); // For JSON db, users has password in it

        const user = db.isOracle()
            ? rawUsers[0]
            : rawUsers.find(u => u.username.toLowerCase() === username.toLowerCase().trim());

        if (user && user.password === password) {
            // Remove password for response
            delete user.password;
            return res.json({ success: true, user });
        } else {
            return res.status(401).json({ error: 'Invalid username or password. Check seeds.' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const users = await db.jsonDb.getUsers();
        const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
        if (exists) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = {
            username: username.trim(),
            password,
            role
        };

        const result = await db.jsonDb.createUser(newUser);
        return res.json({ success: true, user: result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
