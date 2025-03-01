const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const scanRoutes = require('./routes/scan');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/scan', scanRoutes);

// Reset credits at midnight
cron.schedule('0 0 * * *', () => {
    db.run(`UPDATE users SET credits = 20 WHERE role = 'user'`, (err) => {
        if (err) console.error("Error resetting credits:", err);
        else console.log("Credits reset for all users.");
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});