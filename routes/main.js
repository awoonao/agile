const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("main/home", { userId: req.session.userId });
});



router.get('/about', (req, res) => {
    res.render('main/aboutUs');
});

router.get('/privacy-policy', (req, res) => {
    res.render('main/privacyPolicy');
});

router.get('/terms-and-conditions', (req, res) => {
    res.render('main/TandC');
});

  
module.exports = router;
