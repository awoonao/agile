const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");

// Configure multer for profile picture storage
const storage = multer.diskStorage({
    destination: "./public/images/users/",
    filename: (req, file, cb) => {
        cb(null, "profile_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Configure session management
router.use(session({
    secret: 'your_secret_key', // Secret key for session encryption
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Use true for HTTPS
}));

// Render the signup page
router.get('/signup', (req, res) => {
    res.render('user/signup', { error: null });
});

// Handle user signup
router.post('/signup', upload.single('profile_picture'), (req, res) => {
    const { first_name, last_name, username, email, password, confirmPassword, day, month, year } = req.body;
    const profile_picture = req.file ? "/images/users/" + req.file.filename : "/images/users/defaultProfile.jpg";

    if (!first_name || !last_name || !username || !email || !password || !confirmPassword) {
        return res.render('user/signup', { error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
        return res.render('user/signup', { error: 'Passwords do not match' });
    }

    const birthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.render('user/signup', { error: 'Error hashing password' });
        }

        db.run(
            `INSERT INTO Users (first_name, last_name, username, email, password_hash, birthday, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, username, email, hashedPassword, birthday, profile_picture],
            function (err) {
                if (err) {
                    return res.render('user/signup', { error: 'Error creating account' });
                }

                req.session.userId = this.lastID;
                res.redirect('/');
            }
        );
    });
});

// Render the login page
router.get('/login', (req, res) => {
    res.render('user/login', { error: null });
});

// Handle user login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('user/login', { error: 'Username and password are required' });
    }

    db.get('SELECT user_id, password_hash FROM Users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.render('user/login', { error: 'Database error' });
        }

        if (!user) {
            return res.render('user/login', { error: 'Invalid username or password' });
        }

        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (err) {
                return res.render('user/login', { error: 'Error verifying password' });
            }

            if (!match) {
                return res.render('user/login', { error: 'Invalid username or password' });
            }

            req.session.userId = user.user_id;
            res.redirect('/');
        });
    });
});

// Handle user logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.render('user/login', { error: 'Logout failed' });
        }
        res.redirect('/');
    });
});

// Render the forgot password request page
router.get('/forgot-password-email', (req, res) => {
    res.render('user/forgotPasswordEmail', { message: null, error: null });
});

// Handle forgot password email submission
router.post('/forgot-password-email', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.render('user/forgotPasswordEmail', { error: 'Please enter your email', message: null });
    }

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

// Render the forgot password reset page
router.get('/forgot-password-reset', (req, res) => {
    res.render('user/forgotPasswordReset', { error: null, message: null });
});

// Handle password reset
router.post('/forgot-password-reset', (req, res) => {
    const { newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword) {
        return res.render('user/forgotPasswordReset', { error: 'All fields are required', message: null });
    }

    if (newPassword !== confirmNewPassword) {
        return res.render('user/forgotPasswordReset', { error: 'Passwords do not match', message: null });
    }

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
            return res.render('user/forgotPasswordReset', { error: 'Error resetting password', message: null });
        }

        return res.render('user/forgotPasswordReset', { error: null, message: 'Password successfully reset!' });
    });
});

module.exports = router;
