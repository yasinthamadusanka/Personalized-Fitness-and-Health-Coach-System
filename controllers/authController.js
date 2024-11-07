// controllers/authController.js
const bcrypt = require('bcrypt');
const db = require('../config/db');

// Register function
exports.register = (req, res) => {
    console.log("Request body:", req.body); 
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).send("Please fill all required fields");
    }
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error("Error hashing password:", err);
            return res.status(500).send("Error hashing password");
        }

        const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hash], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send('Email already in use');
                }
                return res.status(500).send("Database error");
            }
            res.redirect('/home');
        });
    });
};

// Login function
exports.login = (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(400).send('User not found');

        bcrypt.compare(password, results[0].password, (err, isMatch) => {
            if (err) return res.status(500).send(err);
            if (!isMatch) return res.status(400).send('Incorrect password');
            res.redirect('/home');
        });
    });
};
