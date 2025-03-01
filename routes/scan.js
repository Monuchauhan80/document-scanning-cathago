const express = require('express');
const db = require('../database');
const router = express.Router();

// Upload document
router.post('/upload', (req, res) => {
    const { userId, content } = req.body;

    // Check user credits
    db.get(`SELECT credits FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).send("User not found.");
        }
        if (user.credits < 1) {
            return res.status(400).send("Insufficient credits.");
        }

        // Deduct credit
        db.run(`UPDATE users SET credits = credits - 1 WHERE id = ?`, [userId], (err) => {
            if (err) {
                return res.status(500).send("Error deducting credits.");
            }

            // Save document
            db.run(
                `INSERT INTO documents (userId, content) VALUES (?, ?)`,
                [userId, content],
                function (err) {
                    if (err) {
                        return res.status(500).send("Error saving document.");
                    }
                    res.send({ documentId: this.lastID });
                }
            );
        });
    });
});

// Get matching documents
router.get('/matches/:docId', (req, res) => {
    const { docId } = req.params;

    // Fetch the uploaded document
    db.get(`SELECT content FROM documents WHERE id = ?`, [docId], (err, doc) => {
        if (err || !doc) {
            return res.status(404).send("Document not found.");
        }

        // Fetch all other documents for comparison
        db.all(`SELECT id, content FROM documents WHERE userId = ? AND id != ?`, [req.userId, docId], (err, docs) => {
            if (err) {
                return res.status(500).send("Error fetching documents.");
            }

            // Basic similarity check (Levenshtein distance)
            const matches = docs.filter((d) => {
                const similarity = levenshtein(doc.content, d.content);
                return similarity < 10; // Threshold for similarity
            });

            res.send(matches);
        });
    });
});

// Levenshtein distance function
function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

module.exports = router;