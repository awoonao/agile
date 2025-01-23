//profile.js//
//editPersonalInfo.js
//editDietaryRestrictions.js
//editMyCreations.js
//editSavedRecipes.js

const express = require('express');
const router = express.Router();

router.get('/edit-profile/personal-information', (req, res) => {
    res.render('profile/editProfilePersonalInformation');
});

router.get('/edit-profile/dietary-restrictions', (req, res) => {
    res.render('profile/editProfileDietaryRestrictions');
});

router.get('/edit-profile/my-creations', (req, res) => {
    res.render('profile/editProfileMyCreations');
});

router.get('/edit-profile/saved-recipes', (req, res) => {
    res.render('profile/editProfileSavedRecipes');
});

module.exports = router;
