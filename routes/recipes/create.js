const express = require("express");
const router = express.Router();

// Import middleware for handling file uploads
const { upload } = require("../../middleware/middleware");

// Handle POST request to create a new recipe
router.post("/create-recipe", upload.single("image"), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).redirect("/users/login");
    }

    try {
        // Extract recipe details from the request body
        let { title, description, ingredients, instructions, servings, prep_time, yield: recipeYield, cook_time, dietary_restrictions } = req.body;
        
        // Set the image path if a new image is uploaded, otherwise set it to null
        const imagePath = req.file ? `/images/recipes/${req.file.filename}` : null;

        // Ensure ingredients and instructions are properly formatted as arrays
        ingredients = Array.isArray(ingredients) ? ingredients : [ingredients];
        instructions = Array.isArray(instructions) ? instructions : [instructions];
        dietary_restrictions = dietary_restrictions ? JSON.parse(dietary_restrictions) : [];

        // Insert the new recipe into the database
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

        // Insert each ingredient into the database
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

        // Insert each instruction into the database
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

        // Insert dietary restrictions if any are selected
        if (dietary_restrictions.length > 0) {
            for (const restrictionName of dietary_restrictions) {
                let restrictionId;

                // Check if the restriction already exists
                const existingRestriction = await new Promise((resolve, reject) => {
                    db.get("SELECT restriction_id FROM Dietary_Restrictions WHERE restriction_name = ?", [restrictionName], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (existingRestriction) {
                    restrictionId = existingRestriction.restriction_id;
                } else {
                    // Insert new restriction and retrieve its ID
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

                // Link the restriction to the newly created recipe
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

// Handle GET request to render the create recipe form
router.get("/create-recipe", async (req, res) => {
    try {
        // Fetch all dietary restrictions for selection in the form
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

// Handle GET request to fetch all dietary restrictions for search suggestions
router.get("/dietary-restrictions/all", async (req, res) => {
    try {
        // Retrieve all dietary restrictions from the database
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
