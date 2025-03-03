const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

// Import the upload middleware
const { upload } = require("../../middleware/middleware");

// Initialize Database Connection
const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Handle POST request to create a new recipe
router.post("/create-recipe", upload.single("image"), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).redirect("/users/login");
    }

    try {
        // Extract form data from request body
        let { title, description, ingredients, instructions, servings, prep_time, yield: recipeYield, cook_time, dietary_restrictions } = req.body;
        
        const imagePath = req.file ? `/images/recipes/${req.file.filename}` : null;

        // Ensure ingredients and instructions are properly parsed as arrays
        ingredients = Array.isArray(ingredients) ? ingredients : [ingredients];
        instructions = Array.isArray(instructions) ? instructions : [instructions];
        dietary_restrictions = dietary_restrictions ? JSON.parse(dietary_restrictions) : [];

        // Insert Recipe
        const recipeId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, yield, cook_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [req.session.userId, title, description, imagePath, servings, prep_time, recipeYield, cook_time],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Insert Ingredients
        for (const [index, ingredient] of ingredients.entries()) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order) VALUES (?, ?, ?)`,
                    [recipeId, ingredient, index + 1],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Insert Instructions
        for (const [index, instruction] of instructions.entries()) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO Instructions (recipe_id, instruction_text, step_order) VALUES (?, ?, ?)`,
                    [recipeId, instruction, index + 1],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Insert Dietary Restrictions (if any were selected)
        if (dietary_restrictions.length > 0) {
            for (const restrictionName of dietary_restrictions) {
                let restrictionId;

                // Check if the restriction already exists in the database
                const existingRestriction = await new Promise((resolve, reject) => {
                    db.get("SELECT restriction_id FROM Dietary_Restrictions WHERE restriction_name = ?", [restrictionName], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (existingRestriction) {
                    restrictionId = existingRestriction.restriction_id;
                } else {
                    // Insert new restriction and get its ID
                    restrictionId = await new Promise((resolve, reject) => {
                        db.run(
                            "INSERT INTO Dietary_Restrictions (restriction_name) VALUES (?)",
                            [restrictionName],
                            function (err) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    });
                }

                // Link the restriction to the recipe
                await new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO Recipe_Dietary_Restrictions (recipe_id, restriction_id) VALUES (?, ?)",
                        [recipeId, restrictionId],
                        function (err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }

        res.redirect(`/recipes/${recipeId}`);
    } catch (error) {
        console.error("Error creating recipe:", error);
        res.status(500).send("Error creating recipe: " + error.message);
    }
});

// GET request to render the create recipe form
router.get("/create-recipe", async (req, res) => {
    try {
        const dietaryRestrictions = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM Dietary_Restrictions", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.render("recipes/createRecipe", { dietaryRestrictions });
    } catch (error) {
        console.error("Error fetching dietary restrictions:", error);
        res.status(500).send("Internal Server Error");
    }
});

// GET request to fetch all dietary restrictions for the search suggestion
router.get("/dietary-restrictions/all", async (req, res) => {
    try {
        const dietaryRestrictions = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM Dietary_Restrictions", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json(dietaryRestrictions);
    } catch (error) {
        console.error("Error fetching dietary restrictions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
