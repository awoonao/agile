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

// Fetch User Data
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
                const dateParts = row.birthday.split("-"); // Assuming YYYY-MM-DD format
                row.birthday = {
                    year: dateParts[0],
                    month: dateParts[1],
                    day: dateParts[2]
                };
            }

            // Ensure profile picture is correctly referenced
            row.profile_picture = row.profile_picture ? row.profile_picture : "/images/users/defaultProfile.jpg";

            console.log("Stored Profile Picture Path in DB:", row.profile_picture);
            console.log("User Birthday Retrieved:", row.birthday); // Debugging

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

// Load Saved Recipes Tab in Edit Profile
router.get("/edit-profile/saved-recipes", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;

    // Query to fetch saved recipes along with title and image
    const query = `
        SELECT Recipes.recipe_id, Recipes.title, Recipes.image_url, 
               COALESCE(Recipes.average_appearance_rating, 0) AS appearance_rating, 
               COALESCE(Recipes.average_taste_rating, 0) AS taste_rating
        FROM Saved_Recipes 
        JOIN Recipes ON Saved_Recipes.recipe_id = Recipes.recipe_id
        WHERE Saved_Recipes.user_id = ?
        ORDER BY Saved_Recipes.saved_at DESC
    `;

    db.all(query, [userId], (err, savedRecipes) => {
        if (err) {
            console.error("Error fetching saved recipes:", err);
            return res.status(500).send("Failed to fetch saved recipes.");
        }

        res.render("profile/savedRecipes", { savedRecipes });
    });
});

// Handle Profile Updates
router.post("/edit-profile/update", ensureAuthenticated, upload.single("profile_picture"), (req, res) => {
    const userId = req.session.userId;
    const { first_name, last_name, email, day, month, year, existing_profile_picture } = req.body;

    let profile_picture = existing_profile_picture; // Default to existing picture
    if (req.file) {
        profile_picture = `/images/users/${req.file.filename}`;  // Use new uploaded image if available
    }

    // Ensure all date components are provided
    if (!day || !month || !year) {
        req.session.message = { type: "error", text: "Please select a valid birthday." };
        return res.redirect("/profile/edit-profile");
    }

    const birthday = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // Format as YYYY-MM-DD

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
