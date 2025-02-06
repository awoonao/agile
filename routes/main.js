const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("main/home", { userId: req.session.userId });
});



router.get('/about', (req, res) => {
    res.render('main/aboutUs');
});





  
module.exports = router;
