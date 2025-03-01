const express = require('express');
const db = require('../database');
const router = express.Router();

// Get user profile
router.get('/profile/:userId', (req, res) => {
    const { userId } = req.params;

    db.get(`SELECT username, credits FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).send("User not found.");
        }
        res.send(user);
    });
});

// Request additional credits
router.post('/credits/request', (req, res) => {
    const { userId } = req.body;

    db.run(`INSERT INTO credit_requests (userId) VALUES (?)`, [userId], function (err) {
        if (err) {
            return res.status(500).send("Error requesting credits.");
        }
        res.send({ requestId: this.lastID });
    });
});

module.exports = router;