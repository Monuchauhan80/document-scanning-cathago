const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
    const { username, password, role = 'user' } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).send("Username and password are required.");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Insert user into the database
    db.run(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        [username, hashedPassword, role],
        function (err) {
            if (err) {
                return res.status(400).send("Username already exists.");
            }
            res.send({ userId: this.lastID, username, role });
        }
    );
});

// User login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).send("Username and password are required.");
    }

    // Find the user in the database
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) {
            return res.status(400).send("Invalid credentials.");
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).send("Invalid credentials.");
        }

        // Return user data (excluding password)
        res.send({ userId: user.id, username: user.username, role: user.role, credits: user.credits });
    });
});

module.exports = router;