const express = require("express");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("path");
const router = express.Router();

// Configure Multer for Profile Picture Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images/users/"));
    },
    filename: function (req, file, cb) {
        cb(null, "profile_" + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Ensure User is Authenticated Middleware
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

            callback(null, row);
        }
    );
}

// Fetch all dietary restrictions
router.get("/edit-profile/dietary-restrictions/all", (req, res) => {
    db.all("SELECT restriction_id, restriction_name FROM Dietary_Restrictions", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Failed to fetch dietary restrictions" });
        }
        res.json(rows);
    });
});

// Fetch user's dietary restrictions
router.get("/edit-profile/dietary-restrictions/user", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;
    
    const query = `
        SELECT dr.restriction_id, dr.restriction_name
        FROM User_Dietary_Restrictions udr
        JOIN Dietary_Restrictions dr ON udr.restriction_id = dr.restriction_id
        WHERE udr.user_id = ?
    `;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Failed to fetch user dietary restrictions" });
        }
        res.json(rows);
    });
});

// Redirect /profile to /profile/edit-profile
router.get("/", ensureAuthenticated, (req, res) => {
    res.redirect("/profile/edit-profile");
});

// Render Edit Profile Page
router.get("/edit-profile", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const message = req.session.message;
    req.session.message = null;

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

// Load Personal Information Tab
router.get("/edit-profile/personal-information", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;

    getUserData(userId, (err, userData) => {
        if (err) return res.status(500).send("Internal Server Error");
        if (!userData) return res.status(404).send("User not found");

        res.render("profile/personalInfo", { user: userData });
    });
});

// Handle Profile Updates
router.post("/edit-profile/update", ensureAuthenticated, upload.single("profile_picture"), (req, res) => {
    const userId = req.session.userId;
    const { first_name, last_name, email, day, month, year, existing_profile_picture } = req.body;

    let profile_picture = existing_profile_picture;
    if (req.file) {
        profile_picture = `/images/users/${req.file.filename}`;
    }

    if (!day || !month || !year) {
        req.session.message = { type: "error", text: "Please select a valid birthday." };
        return res.redirect("/profile/edit-profile");
    }

    const birthday = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    db.run(
        `UPDATE Users SET first_name = ?, last_name = ?, email = ?, birthday = ?, profile_picture = ? WHERE user_id = ?`,
        [first_name, last_name, email, birthday, profile_picture, userId],
        function (err) {
            if (err) {
                req.session.message = { type: "error", text: "Error updating profile." };
            } else {
                req.session.message = { type: "success", text: "Profile updated successfully!" };
            }
            res.redirect("/profile/edit-profile");
        }
    );
});

// Load Dietary Restrictions Tab
router.get("/edit-profile/dietary-restrictions", ensureAuthenticated, (req, res) => {
    res.render("profile/dietaryRestrictions");  
});

// Add a Dietary Restriction for the User
router.post("/edit-profile/dietary-restrictions/add", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const { restriction_name } = req.body;

    if (!restriction_name) {
        return res.status(400).json({ error: "Dietary restriction name is required" });
    }

    // Check if the restriction already exists in the database
    db.get("SELECT restriction_id FROM Dietary_Restrictions WHERE restriction_name = ?", [restriction_name], (err, existing) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error while checking restriction" });
        }

        if (existing) {
            // If restriction exists, associate it with the user
            db.run("INSERT INTO User_Dietary_Restrictions (user_id, restriction_id) VALUES (?, ?)", [userId, existing.restriction_id], (err) => {
                if (err) return res.status(500).json({ error: "Failed to add dietary restriction" });
                return res.json({ message: "Dietary restriction added successfully", restriction: existing });
            });
        } else {
            // Insert new restriction and associate it with the user
            db.run("INSERT INTO Dietary_Restrictions (restriction_name, created_by) VALUES (?, ?)", [restriction_name, userId], function (err) {
                if (err) return res.status(500).json({ error: "Failed to create dietary restriction" });

                const newRestrictionId = this.lastID;
                db.run("INSERT INTO User_Dietary_Restrictions (user_id, restriction_id) VALUES (?, ?)", [userId, newRestrictionId], (err) => {
                    if (err) return res.status(500).json({ error: "Failed to associate dietary restriction" });
                    return res.json({ message: "Dietary restriction added successfully", restriction: { restriction_id: newRestrictionId, restriction_name } });
                });
            });
        }
    });
});

// Remove a Dietary Restriction for the User
router.delete("/edit-profile/dietary-restrictions/remove", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const { restriction_id } = req.body;

    if (!restriction_id) {
        return res.status(400).json({ error: "Restriction ID is required" });
    }

    db.run("DELETE FROM User_Dietary_Restrictions WHERE user_id = ? AND restriction_id = ?", 
        [userId, restriction_id], 
        (err) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to remove dietary restriction" });
            }
            res.json({ message: "Dietary restriction removed successfully" });
        }
    );
});

// Load My Creations Tab
router.get("/edit-profile/my-creations", ensureAuthenticated, async (req, res) => {
    const userId = req.session.userId;

    try {
        const recipes = await new Promise((resolve, reject) => {
            db.all(
                `
                SELECT recipe_id, title, image_url, 
                        COALESCE(average_appearance_rating, 0) AS appearance_rating, 
                        COALESCE(average_taste_rating, 0) AS taste_rating
                 FROM Recipes 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC
                `,
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        res.render("profile/myCreations", { recipes });
    } catch (error) {
        res.status(500).send("Failed to fetch recipes");
    }
});

// Route to delete a recipe
router.delete("/edit-profile/my-creations/:recipeId/delete", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const recipeId = req.params.recipeId;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    db.run(
        "DELETE FROM Recipes WHERE recipe_id = ? AND user_id = ?",
        [recipeId, userId],
        function (err) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to delete recipe" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Recipe not found or not authorized to delete" });
            }
            res.json({ message: "Recipe deleted successfully" });
        }
    );
});

// Load Saved Recipes Tab
router.get("/edit-profile/saved-recipes", ensureAuthenticated, (req, res) => {
    const userId = req.session.userId;

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
            return res.status(500).send("Failed to fetch saved recipes.");
        }

        res.render("profile/savedRecipes", { savedRecipes });
    });
});

module.exports = router;
