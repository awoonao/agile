const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('main/home');
});



router.get('/about', (req, res) => {
    res.render('main/aboutUs');
});





  
module.exports = router;
