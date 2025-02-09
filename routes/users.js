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

//Signup (GET)
router.get('/signup', (req, res) => {
    res.render('user/signup', { error: null }); 
});

//Signup (POST)

router.post('/signup', (req, res) => {
    const { first_name, last_name, username, email, password, confirmPassword, day, month, year } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !username || !email || !password || !confirmPassword || !day || !month || !year) {
        return res.render('user/signup', { error: 'All fields are required' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.render('user/signup', { error: 'Passwords do not match' });
    }

    // Format birthday as YYYY-MM-DD
    const birthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Check if username or email already exists
    db.get('SELECT * FROM Users WHERE username = ? OR email = ?', [username, email], (err, existingUser) => {
        if (err) {
            return res.render('user/signup', { error: 'Database error' });
        }

        if (existingUser) {
            return res.render('user/signup', { error: 'Username or email already taken' });
        }

        // Hash the password using bcrypt
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.render('user/signup', { error: 'Error hashing password' });
            }

            // Insert new user into database
            db.run(
                `INSERT INTO Users (first_name, last_name, username, email, password_hash, birthday) VALUES (?, ?, ?, ?, ?, ?)`,
                [first_name, last_name, username, email, hashedPassword, birthday],
                function (err) {
                    if (err) {
                        return res.render('user/signup', { error: 'Error creating account' });
                    }

                    // Store user session after signup
                    req.session.userId = this.lastID;
                    res.redirect('/');
                }
            );
        });
    });
});

// Login (GET)
router.get('/login', (req, res) => {
    res.render('user/login', { error: null }); // Pass 'error' as null initially
});

// Login (POST)
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('user/login', { error: 'Username and password are required' });
    }

    // Query the database for the user
    db.get('SELECT user_id, password_hash FROM Users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.render('user/login', { error: 'Database error' });
        }

        if (!user) {
            return res.render('user/login', { error: 'Invalid username or password' });
        }

        // Compare entered password with hashed password
        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (err) {
                return res.render('user/login', { error: 'Error verifying password' });
            }

            if (!match) {
                return res.render('user/login', { error: 'Invalid username or password' });
            }

            // Store user session
            req.session.userId = user.user_id;

            // Redirect to the home page after login
            res.redirect('/');
        });
    });
});

// Logout (POST)
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.render('user/login', { error: 'Logout failed' });
        }
        res.redirect('/'); // Redirect to home page after logout
    });
});

// Forgot Password - Email Page (GET)
router.get('/forgot-password-email', (req, res) => {
    res.render('user/forgotPasswordEmail', { message: null, error: null });
});

// Forgot Password - Email Page (POST)
router.post('/forgot-password-email', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.render('user/forgotPasswordEmail', { error: 'Please enter your email', message: null });
    }

    // Check if the email exists in the database
    db.get('SELECT * FROM Users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.render('user/forgotPasswordEmail', { error: 'Database error', message: null });
        }

        if (!user) {
            return res.render('user/forgotPasswordEmail', { error: 'No account found with that email', message: null });
        }

        return res.render('user/forgotPasswordEmail', { error: null, message: 'Password reset link sent!' });
    });
});

// Forgot Password Reset (GET)
router.get('/forgot-password-reset', (req, res) => {
    res.render('user/forgotPasswordReset', { error: null, message: null }); // Ensure message is passed
});


// Forgot Password Reset (POST)
router.post('/forgot-password-reset', (req, res) => {
    const { newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword) {
        return res.render('user/forgotPasswordReset', { error: 'All fields are required', message: null });
    }

    if (newPassword !== confirmNewPassword) {
        return res.render('user/forgotPasswordReset', { error: 'Passwords do not match', message: null });
    }

    // Simulate password reset (Normally, we would verify a reset token and user ID)
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
            return res.render('user/forgotPasswordReset', { error: 'Error resetting password', message: null });
        }

        // Show success message
        return res.render('user/forgotPasswordReset', { error: null, message: 'Password successfully reset!' });
    });
});

module.exports = router;
