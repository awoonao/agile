/**
 * users.js
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 * and the suggested pattern for retrieving data by executing queries
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library
* 
 */
const express = require('express');
const router = express.Router();

router.get('/signup', (req, res) => {
    res.render('user/signup');
});

router.get('/login', (req, res) => {
    res.render('user/login');
});

router.get('/forgot-password-email', (req, res) => {
    res.render('user/forgotPasswordEmail');
});

router.get('/forgot-password-reset', (req, res) => {
    res.render('user/forgotPasswordReset');
});

module.exports = router;
