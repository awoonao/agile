const express = require("express");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();

//Configure Multer for Profile Picture Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images/users/"));
    },
    filename: function (req, file, cb) {
        cb(null, "profile_" + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

//Ensure User is Authenticated Middleware
const ensureAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/users/login");
    }
    next();
};

//Fetch User Data
function getUserData(userId, callback) {
    db.get(
        `SELECT first_name, last_name, email, birthday, profile_picture FROM Users WHERE user_id = ?`,
        [userId],
        (err, row) => {
            if (err) {
                console.error("Database error:", err.message);
                return callback(err, null);
            }
            if (!row) return callback(null, null);

            // Convert birthday to { day, month, year }
            if (row.birthday) {
                const dateParts = row.birthday.split("-");
                row.birthday = {
                    day: parseInt(dateParts[2], 10),
                    month: parseInt(dateParts[1], 10),
                    year: parseInt(dateParts[0], 10)
                };
            }

            // Ensure profile picture is correctly referenced
            row.profile_picture = row.profile_picture ? row.profile_picture : "/images/users/defaultProfile.jpg";

            // 🔹 Debugging: Check if the profile picture path is stored correctly
            console.log("Stored Profile Picture Path in DB:", row.profile_picture);

            callback(null, row);
        }
    );
}

//Redirect /profile to /profile/edit-profile
router.get("/", ensureAuthenticated, (req, res) => {
    res.redirect("/profile/edit-profile");
});

//Render Edit Profile Page - Default to Personal Information
router.get("/edit-profile", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const message = req.session.message;
    req.session.message = null; // Clear message after displaying it

    getUserData(userId, (err, userData) => {
        if (err) return res.status(500).send("Internal Server Error");
        if (!userData) return res.status(404).send("User not found");

        res.render("profile/editProfile", {
            user: userData,
            activeTab: "personal-information",
            message
        });
    });
});

//Load Personal Information Tab
router.get("/edit-profile/personal-information", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;

    getUserData(userId, (err, userData) => {
        if (err) return res.status(500).send("Internal Server Error");
        if (!userData) return res.status(404).send("User not found");

        res.render("profile/personalInfo", { user: userData });
    });
});


//Load Dietary Restrictions Tab
router.get("/edit-profile/dietary-restrictions", ensureAuthenticated, (req, res) => {
    res.render("profile/dietaryRestrictions");
});

//Load My Creations Tab
router.get("/edit-profile/my-creations", ensureAuthenticated, async (req, res) => {
    const userId = req.session.userId;

    try {
        const recipes = await new Promise((resolve, reject) => {
            db.all(
                `SELECT recipe_id, title, image_url, 
                        COALESCE(average_appearance_rating, 0) AS appearance_rating, 
                        COALESCE(average_taste_rating, 0) AS taste_rating
                 FROM Recipes 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC`,
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        res.render("profile/myCreations", { recipes });
    } catch (error) {
        console.error("Error fetching recipes:", error);
        res.status(500).send("Failed to fetch recipes");
    }
});

//Load Saved Recipes Tab
router.get("/edit-profile/saved-recipes", ensureAuthenticated, (req, res) => {
    res.render("profile/savedRecipes");
});

//Handle Profile Updates
router.post("/edit-profile/update", ensureAuthenticated, upload.single("profile_picture"), (req, res) => {
    const userId = req.session.userId;
    const { first_name, last_name, email, day, month, year } = req.body;

    let profile_picture = req.body.existing_profile_picture; // Default to existing picture
    if (req.file) {
        profile_picture = `/images/users/${req.file.filename}`; // ✅ Now correctly referenced for static serving
    }    

    const birthday = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    db.run(
        `UPDATE Users SET first_name = ?, last_name = ?, email = ?, birthday = ?, profile_picture = ? WHERE user_id = ?`,
        [first_name, last_name, email, birthday, profile_picture, userId],
        function (err) {
            if (err) {
                console.error("Error updating user data:", err.message);
                req.session.message = { type: "error", text: "Error updating profile." };
            } else {
                req.session.message = { type: "success", text: "Profile updated successfully!" };
            }
            res.redirect("/profile/edit-profile");
        }
    );
});



module.exports = router;
