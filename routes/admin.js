const express = require('express');
const db = require('../database');
const router = express.Router();

// Approve or deny credit requests
router.post('/credits/approve', (req, res) => {
    const { requestId, action } = req.body;

    if (!['approve', 'deny'].includes(action)) {
        return res.status(400).send("Invalid action.");
    }

    // Update credit request status
    db.run(
        `UPDATE credit_requests SET status = ? WHERE id = ?`,
        [action === 'approve' ? 'approved' : 'denied', requestId],
        function (err) {
            if (err) {
                return res.status(500).send("Error updating credit request.");
            }

            // Add credits if approved
            if (action === 'approve') {
                db.run(
                    `UPDATE users SET credits = credits + 10 WHERE id = (SELECT userId FROM credit_requests WHERE id = ?)`,
                    [requestId],
                    function (err) {
                        if (err) {
                            return res.status(500).send("Error adding credits.");
                        }
                        res.send("Credits approved and added.");
                    }
                );
            } else {
                res.send("Credit request denied.");
            }
        }
    );
});

// Get analytics for admins
router.get('/analytics', (req, res) => {
    db.all(
        `SELECT username, credits, (SELECT COUNT(*) FROM documents WHERE userId = users.id) AS scanCount FROM users`,
        (err, rows) => {
            if (err) {
                return res.status(500).send("Error fetching analytics.");
            }
            res.send(rows);
        }
    );
});

module.exports = router;