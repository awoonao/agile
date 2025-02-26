const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("main/home", { userId: req.session.userId });
});

router.get('/about', (req, res) => {
    res.render('main/aboutUs');
});

// Handle form submission to contact_us table
router.post('/contact', (req, res) => {
    const { contact_name, contact_email, contact_message } = req.body;

    if (!contact_name || !contact_email) {
        return res.status(400).send("Name and Email are required!");
    }

    const sql = `INSERT INTO Contact_us (contact_name, contact_email, contact_message) VALUES (?, ?, ?)`;
    const values = [contact_name, contact_email, contact_message];

    db.run(sql, values, function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Database error occurred.");
        }
        res.redirect('/about'); // Redirect back to the about page after submission
    });
});

router.get('/privacy-policy', (req, res) => {
    res.render('main/privacyPolicy');
});

router.get('/terms-and-conditions', (req, res) => {
    res.render('main/TandC');
});

  
module.exports = router;
