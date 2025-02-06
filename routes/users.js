/**
 * users.js
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 * and the suggested pattern for retrieving data by executing queries
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library
* 
 */
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const sqlite3 = require('sqlite3').verbose();

//Middleware for session handling below
router.use(session({
    secret: 'your_secret_key', // Change this to a secure random value
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

router.get('/signup', (req, res) => {
    res.render('user/signup');
});

// Login (GET)
router.get('/login', (req, res) => {
    res.render('user/login', { error: null }); // Pass 'error' as null initially
});

//Login (POST)
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query the database for the user
    db.get('SELECT user_id, password_hash FROM Users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Compare entered password with hashed password
        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (err) {
                return res.status(500).json({ error: 'Error verifying password' });
            }

            if (!match) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Store user session
            req.session.userId = user.user_id;
            res.json({ message: 'Login successful', userId: user.user_id });
        });
    });
});

// Logout (POST)
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

router.get('/forgot-password-email', (req, res) => {
    res.render('user/forgotPasswordEmail');
});

router.get('/forgot-password-reset', (req, res) => {
    res.render('user/forgotPasswordReset');
});

module.exports = router;
